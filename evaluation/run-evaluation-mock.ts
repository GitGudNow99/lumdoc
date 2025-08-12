#!/usr/bin/env node
/**
 * Mock Evaluation Harness
 * This version simulates the evaluation without requiring a running server
 * Used for testing the evaluation infrastructure itself
 */

import fs from 'fs';
import path from 'path';

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

class MockEvaluationHarness {
  private results: EvaluationResult[] = [];

  async runEvaluation(): Promise<void> {
    console.log('🔬 Starting MOCK evaluation harness...\n');
    console.log('⚠️  Note: This is a mock test without a live server\n');
    
    // Load golden queries
    const queriesPath = path.join(__dirname, 'golden-queries.json');
    const { queries } = JSON.parse(fs.readFileSync(queriesPath, 'utf-8'));
    
    // Simulate evaluation for each query
    for (const query of queries) {
      const result = this.simulateEvaluation(query);
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

  private simulateEvaluation(query: GoldenQuery): EvaluationResult {
    // Simulate realistic results for different query types
    const isNegative = query.category === 'negative';
    const shouldPass = Math.random() > 0.2; // 80% pass rate
    
    const errors: string[] = [];
    
    // Simulate metrics
    const metrics = {
      keywordCoverage: shouldPass ? 0.7 + Math.random() * 0.3 : Math.random() * 0.5,
      hasCitations: shouldPass && !isNegative,
      confidence: shouldPass ? 0.6 + Math.random() * 0.4 : Math.random() * 0.6,
      responseTime: 200 + Math.random() * 1000,
      refused: isNegative && query.should_refuse,
    };
    
    // Simulate validation
    if (!shouldPass) {
      if (Math.random() > 0.5) {
        errors.push('Low keyword coverage');
      }
      if (Math.random() > 0.5) {
        errors.push('Missing citations');
      }
      if (Math.random() > 0.5) {
        errors.push('Low confidence');
      }
    }
    
    return {
      queryId: query.id,
      category: query.category,
      passed: shouldPass && errors.length === 0,
      metrics,
      errors,
    };
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MOCK EVALUATION REPORT');
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
    
    // Note about mock test
    console.log('\n⚠️  This was a MOCK test. For real evaluation:');
    console.log('  1. Start the dev server: npm run dev');
    console.log('  2. Index some documents');
    console.log('  3. Run: npm run eval');
    
    // Save results
    const reportPath = path.join(__dirname, `mock-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Mock report saved to: ${reportPath}`);
    
    // Exit with success (mock always passes)
    process.exit(0);
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

// Run mock evaluation
const harness = new MockEvaluationHarness();
harness.runEvaluation().catch(console.error);