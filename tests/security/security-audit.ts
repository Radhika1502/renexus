import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as axios from 'axios';

// Load environment variables
dotenv.config();

/**
 * Security Audit Tool for Renexus Application
 * This script performs various security checks on the codebase and application
 */

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  description: string;
  location?: string;
  recommendation: string;
}

class SecurityAuditor {
  private issues: SecurityIssue[] = [];
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async runAudit(): Promise<SecurityIssue[]> {
    console.log('Starting security audit...');
    
    // Run all audit checks
    await this.checkEnvFiles();
    await this.checkHardcodedSecrets();
    await this.checkDependencyVulnerabilities();
    await this.checkAuthImplementation();
    await this.checkXSSVulnerabilities();
    await this.checkSQLInjection();
    
    console.log(`Audit complete. Found ${this.issues.length} issues.`);
    return this.issues;
  }

  private async checkEnvFiles(): Promise<void> {
    console.log('Checking environment files...');
    
    // Check if .env file is in .gitignore
    const gitignorePath = path.join(this.basePath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.env')) {
        this.issues.push({
          severity: 'high',
          type: 'Environment Security',
          description: '.env file is not included in .gitignore',
          location: '.gitignore',
          recommendation: 'Add .env to .gitignore to prevent committing sensitive information'
        });
      }
    }
    
    // Check for .env files in the repository
    const envFiles = this.findFiles(this.basePath, '.env');
    for (const file of envFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('API_KEY=') || content.includes('SECRET=') || content.includes('PASSWORD=')) {
        this.issues.push({
          severity: 'critical',
          type: 'Sensitive Data Exposure',
          description: 'Environment file contains sensitive data',
          location: file,
          recommendation: 'Remove sensitive data from environment files and use environment variables instead'
        });
      }
    }
  }

  private async checkHardcodedSecrets(): Promise<void> {
    console.log('Checking for hardcoded secrets...');
    
    const sourceFiles = this.findFiles(this.basePath, '.ts', '.js', '.tsx', '.jsx');
    const secretPatterns = [
      /['"]?api[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i,
      /['"]?secret['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{10,}['"]/i,
      /['"]?password['"]?\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /['"]?auth[_-]?token['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-.=]{10,}['"]/i
    ];
    
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          this.issues.push({
            severity: 'critical',
            type: 'Hardcoded Secrets',
            description: 'Potential hardcoded secret or API key found',
            location: file,
            recommendation: 'Move secrets to environment variables or a secure vault'
          });
          break; // Only report once per file
        }
      }
    }
  }

  private async checkDependencyVulnerabilities(): Promise<void> {
    console.log('Checking for dependency vulnerabilities...');
    
    // This would typically use a tool like npm audit
    // For this example, we'll just check for outdated dependencies
    const packageJsonPath = path.join(this.basePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for known vulnerable packages (example)
      const knownVulnerablePackages = [
        { name: 'lodash', version: '<4.17.20' },
        { name: 'axios', version: '<0.21.1' },
        { name: 'react-scripts', version: '<4.0.3' }
      ];
      
      for (const pkg of knownVulnerablePackages) {
        const dependencies = { 
          ...packageJson.dependencies, 
          ...packageJson.devDependencies 
        };
        
        if (dependencies[pkg.name]) {
          // Simple version check (in a real tool, use semver)
          if (dependencies[pkg.name].replace('^', '').replace('~', '') < pkg.version.replace('<', '')) {
            this.issues.push({
              severity: 'high',
              type: 'Vulnerable Dependency',
              description: `Package ${pkg.name} has a known vulnerability in versions ${pkg.version}`,
              location: 'package.json',
              recommendation: `Update ${pkg.name} to a newer version`
            });
          }
        }
      }
    }
  }

  private async checkAuthImplementation(): Promise<void> {
    console.log('Checking authentication implementation...');
    
    const authFiles = this.findFiles(path.join(this.basePath, 'apps/api/src'), 'auth');
    
    for (const file of authFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for weak password hashing
      if (content.includes('md5(') || content.includes('sha1(')) {
        this.issues.push({
          severity: 'critical',
          type: 'Weak Cryptography',
          description: 'Using weak hashing algorithm for passwords',
          location: file,
          recommendation: 'Use bcrypt or Argon2 for password hashing'
        });
      }
      
      // Check for JWT without expiration
      if (content.includes('jwt.sign(') && !content.includes('expiresIn')) {
        this.issues.push({
          severity: 'high',
          type: 'JWT Security',
          description: 'JWT tokens created without expiration',
          location: file,
          recommendation: 'Add expiresIn option to JWT tokens'
        });
      }
    }
  }

  private async checkXSSVulnerabilities(): Promise<void> {
    console.log('Checking for XSS vulnerabilities...');
    
    const frontendFiles = this.findFiles(
      path.join(this.basePath, 'apps/web-client/src'), 
      '.tsx', '.jsx', '.js', '.ts'
    );
    
    for (const file of frontendFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for dangerous use of dangerouslySetInnerHTML
      if (content.includes('dangerouslySetInnerHTML') && !content.includes('DOMPurify')) {
        this.issues.push({
          severity: 'high',
          type: 'XSS Vulnerability',
          description: 'Using dangerouslySetInnerHTML without sanitization',
          location: file,
          recommendation: 'Use DOMPurify to sanitize HTML before using dangerouslySetInnerHTML'
        });
      }
      
      // Check for direct DOM manipulation without sanitization
      if ((content.includes('innerHTML =') || content.includes('document.write(')) && !content.includes('DOMPurify')) {
        this.issues.push({
          severity: 'high',
          type: 'XSS Vulnerability',
          description: 'Direct DOM manipulation without sanitization',
          location: file,
          recommendation: 'Use DOMPurify to sanitize HTML before inserting into DOM'
        });
      }
    }
  }

  private async checkSQLInjection(): Promise<void> {
    console.log('Checking for SQL injection vulnerabilities...');
    
    const backendFiles = this.findFiles(
      path.join(this.basePath, 'apps/api/src'), 
      '.ts', '.js'
    );
    
    for (const file of backendFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for raw SQL queries with string concatenation
      if (
        (content.includes('$queryRaw') || content.includes('executeQuery')) && 
        (content.includes('${') || content.includes("' +") || content.includes("'+") || content.includes("+ '"))
      ) {
        this.issues.push({
          severity: 'critical',
          type: 'SQL Injection',
          description: 'Potential SQL injection vulnerability with string concatenation in query',
          location: file,
          recommendation: 'Use parameterized queries or Prisma\'s query builder instead of string concatenation'
        });
      }
    }
  }

  private findFiles(dir: string, ...extensions: string[]): string[] {
    let results: string[] = [];
    
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively search directories, but skip node_modules and .git
        if (file !== 'node_modules' && file !== '.git') {
          results = results.concat(this.findFiles(filePath, ...extensions));
        }
      } else {
        // Check if file matches any of the extensions
        if (extensions.some(ext => 
          file.endsWith(ext) || 
          file.includes(ext) // For directory names like 'auth'
        )) {
          results.push(filePath);
        }
      }
    }
    
    return results;
  }

  generateReport(): void {
    const reportPath = path.join(this.basePath, 'security-audit-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      issuesBySeverity: {
        critical: this.issues.filter(i => i.severity === 'critical').length,
        high: this.issues.filter(i => i.severity === 'high').length,
        medium: this.issues.filter(i => i.severity === 'medium').length,
        low: this.issues.filter(i => i.severity === 'low').length,
        info: this.issues.filter(i => i.severity === 'info').length,
      },
      issues: this.issues
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Security audit report generated at ${reportPath}`);
  }
}

// Run the audit
const auditor = new SecurityAuditor(path.resolve(__dirname, '../../'));
auditor.runAudit().then(() => {
  auditor.generateReport();
}).catch(error => {
  console.error('Error running security audit:', error);
});
