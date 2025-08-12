#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

interface GoldenQuery {
  id: string;
  category: string;
  query: string;
  expected_keywords: string[];
  expected_citations: boolean;
  min_confidence: number;
  should_refuse?: boolean;
  version?: string;
}

interface EvaluationResult {
  queryId: string;
  category: string;
  passed: boolean;
  metrics: {
    keywordCoverage: number;
    hasCitations: boolean;
    confidence: number;
    responseTime: number;
    refused: boolean;
  };
  errors: string[];
}

class EvaluationHarness {
  private apiUrl: string;
  private results: EvaluationResult[] = [];

  constructor(apiUrl: string = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  async runEvaluation(): Promise<void> {
    console.log('🔬 Starting evaluation harness...\n');
    
    // Load golden queries
    const queriesPath = path.join(__dirname, 'golden-queries.json');
    const { queries } = JSON.parse(fs.readFileSync(queriesPath, 'utf-8'));
    
    // Run each query
    for (const query of queries) {
      const result = await this.evaluateQuery(query);
      this.results.push(result);
      
      // Print progress
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${query.id}: ${query.query.slice(0, 50)}...`);
      if (!result.passed) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    }
    
    // Generate report
    this.generateReport();
  }

  private async evaluateQuery(query: GoldenQuery): Promise<EvaluationResult> {
    const errors: string[] = [];
    const startTime = performance.now();
    
    try {
      // Call answer API
      const response = await fetch(`${this.apiUrl}/api/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.query,
          mode: 'strict',
          version: query.version || '2.3',
        }),
      });
      
      const responseTime = performance.now() - startTime;
      
      if (!response.ok) {
        errors.push(`API error: ${response.status}`);
        return this.createFailedResult(query, errors, responseTime);
      }
      
      const data = await response.json();
      
      // Evaluate response
      const metrics = {
        keywordCoverage: this.calculateKeywordCoverage(
          data.answer || '',
          query.expected_keywords
        ),
        hasCitations: this.hasCitations(data),
        confidence: data.confidence || 0,
        responseTime,
        refused: this.isRefusal(data.answer || ''),
      };
      
      // Check criteria
      if (query.should_refuse && !metrics.refused) {
        errors.push('Should have refused query');
      }
      if (!query.should_refuse && metrics.refused) {
        errors.push('Incorrectly refused query');
      }
      if (query.expected_citations && !metrics.hasCitations) {
        errors.push('Missing citations');
      }
      if (metrics.confidence < query.min_confidence) {
        errors.push(`Low confidence: ${metrics.confidence.toFixed(2)} < ${query.min_confidence}`);
      }
      if (metrics.keywordCoverage < 0.5 && !query.should_refuse) {
        errors.push(`Low keyword coverage: ${(metrics.keywordCoverage * 100).toFixed(0)}%`);
      }
      if (responseTime > 5000) {
        errors.push(`Slow response: ${responseTime.toFixed(0)}ms`);
      }
      
      return {
        queryId: query.id,
        category: query.category,
        passed: errors.length === 0,
        metrics,
        errors,
      };
      
    } catch (error) {
      errors.push(`Exception: ${error}`);
      return this.createFailedResult(query, errors, performance.now() - startTime);
    }
  }

  private calculateKeywordCoverage(answer: string, keywords: string[]): number {
    if (keywords.length === 0) return 1;
    
    const lowerAnswer = answer.toLowerCase();
    const found = keywords.filter(keyword => 
      lowerAnswer.includes(keyword.toLowerCase())
    );
    
    return found.length / keywords.length;
  }

  private hasCitations(data: any): boolean {
    return data.citations && data.citations.length > 0;
  }

  private isRefusal(answer: string): boolean {
    const refusalPhrases = [
      'cannot answer',
      'don\'t have information',
      'out of scope',
      'not related to grandMA3',
      'closest matches',
    ];
    
    const lowerAnswer = answer.toLowerCase();
    return refusalPhrases.some(phrase => lowerAnswer.includes(phrase));
  }

  private createFailedResult(
    query: GoldenQuery,
    errors: string[],
    responseTime: number
  ): EvaluationResult {
    return {
      queryId: query.id,
      category: query.category,
      passed: false,
      metrics: {
        keywordCoverage: 0,
        hasCitations: false,
        confidence: 0,
        responseTime,
        refused: false,
      },
      errors,
    };
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 EVALUATION REPORT');
    console.log('='.repeat(60) + '\n');
    
    // Overall stats
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const passRate = (passed / total * 100).toFixed(1);
    
    console.log(`Overall Pass Rate: ${passed}/${total} (${passRate}%)`);
    
    // By category
    const categories = [...new Set(this.results.map(r => r.category))];
    console.log('\nBy Category:');
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.passed).length;
      const categoryRate = (categoryPassed / categoryResults.length * 100).toFixed(1);
      console.log(`  ${category}: ${categoryPassed}/${categoryResults.length} (${categoryRate}%)`);
    }
    
    // Metrics
    console.log('\nAverage Metrics:');
    
    const avgConfidence = this.average(this.results.map(r => r.metrics.confidence));
    const avgKeywordCoverage = this.average(this.results.map(r => r.metrics.keywordCoverage));
    const avgResponseTime = this.average(this.results.map(r => r.metrics.responseTime));
    const citationRate = this.results.filter(r => r.metrics.hasCitations).length / total;
    
    console.log(`  Confidence: ${avgConfidence.toFixed(2)}`);
    console.log(`  Keyword Coverage: ${(avgKeywordCoverage * 100).toFixed(1)}%`);
    console.log(`  Citation Rate: ${(citationRate * 100).toFixed(1)}%`);
    console.log(`  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
    
    // Failed queries
    const failed = this.results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('\n❌ Failed Queries:');
      for (const result of failed) {
        console.log(`  ${result.queryId}: ${result.errors.join(', ')}`);
      }
    }
    
    // Save detailed results
    const reportPath = path.join(__dirname, `report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    
    // Exit code
    const exitCode = passRate === '100.0' ? 0 : 1;
    process.exit(exitCode);
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

// Run evaluation
const harness = new EvaluationHarness(process.env.API_URL || 'http://localhost:3000');
harness.runEvaluation().catch(console.error);