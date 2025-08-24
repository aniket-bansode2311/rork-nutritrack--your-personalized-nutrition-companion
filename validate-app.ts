import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  passed: number;
  failed: number;
  total: number;
  details: { name: string; status: 'pass' | 'fail'; message?: string }[];
}

class AppValidator {
  private results: ValidationResult = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m'
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}${message}${reset}`);
  }

  private runCommand(command: string, timeout = 30000): { success: boolean; output: string } {
    try {
      const output = execSync(command, { 
        timeout,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: error.message || 'Command failed' };
    }
  }

  private addResult(name: string, success: boolean, message?: string) {
    this.results.total++;
    if (success) {
      this.results.passed++;
      this.results.details.push({ name, status: 'pass' });
      this.log(`✅ ${name}`, 'success');
    } else {
      this.results.failed++;
      this.results.details.push({ name, status: 'fail', message });
      this.log(`❌ ${name}${message ? ': ' + message : ''}`, 'error');
    }
  }

  // Validate file structure
  validateFileStructure(): void {
    this.log('\n📁 Validating file structure...', 'info');
    
    const requiredFiles = [
      'app/_layout.tsx',
      'app/(tabs)/_layout.tsx',
      'app/(auth)/_layout.tsx',
      'app/(tabs)/index.tsx',
      'app/(tabs)/recipes.tsx',
      'app/(tabs)/diary.tsx',
      'app/(tabs)/settings.tsx',
      'package.json',
      'tsconfig.json',
      'app.json'
    ];

    const requiredDirs = [
      'app',
      'components',
      'hooks',
      'lib',
      'types',
      'backend',
      'backend/trpc'
    ];

    // Check required files
    requiredFiles.forEach(file => {
      const exists = existsSync(file);
      this.addResult(`File exists: ${file}`, exists);
    });

    // Check required directories
    requiredDirs.forEach(dir => {
      const exists = existsSync(dir) && statSync(dir).isDirectory();
      this.addResult(`Directory exists: ${dir}`, exists);
    });
  }

  // Validate TypeScript compilation
  validateTypeScript(): void {
    this.log('\n🔍 Validating TypeScript compilation...', 'info');
    
    const result = this.runCommand('npx tsc --noEmit', 60000);
    this.addResult('TypeScript compilation', result.success, result.output);
  }

  // Validate package dependencies
  validateDependencies(): void {
    this.log('\n📦 Validating dependencies...', 'info');
    
    const result = this.runCommand('npm ls --depth=0', 30000);
    this.addResult('Dependencies check', result.success, result.output);
  }

  // Run unit tests
  runTests(): void {
    this.log('\n🧪 Running unit tests...', 'info');
    
    const result = this.runCommand('npm test -- --watchAll=false', 120000);
    this.addResult('Unit tests', result.success, result.output);
  }

  // Validate routing structure
  validateRouting(): void {
    this.log('\n🛣️ Validating routing structure...', 'info');
    
    // Check for proper tab structure
    const tabsDir = 'app/(tabs)';
    if (existsSync(tabsDir)) {
      const tabFiles = readdirSync(tabsDir).filter(f => f.endsWith('.tsx') && f !== '_layout.tsx');
      this.addResult('Tab routes exist', tabFiles.length > 0);
      
      // Check for _layout.tsx in tabs
      const tabLayout = join(tabsDir, '_layout.tsx');
      this.addResult('Tabs layout exists', existsSync(tabLayout));
    }

    // Check auth structure
    const authDir = 'app/(auth)';
    if (existsSync(authDir)) {
      const authFiles = readdirSync(authDir).filter(f => f.endsWith('.tsx') && f !== '_layout.tsx');
      this.addResult('Auth routes exist', authFiles.length > 0);
    }
  }

  // Validate backend structure
  validateBackend(): void {
    this.log('\n🔧 Validating backend structure...', 'info');
    
    const backendFiles = [
      'backend/hono.ts',
      'backend/trpc/app-router.ts',
      'backend/trpc/create-context.ts'
    ];

    backendFiles.forEach(file => {
      const exists = existsSync(file);
      this.addResult(`Backend file: ${file}`, exists);
    });

    // Check for tRPC routes
    const routesDir = 'backend/trpc/routes';
    if (existsSync(routesDir)) {
      const hasRoutes = this.hasFilesRecursively(routesDir, '.ts');
      this.addResult('tRPC routes exist', hasRoutes);
    }
  }

  // Validate component structure
  validateComponents(): void {
    this.log('\n🧩 Validating components...', 'info');
    
    const componentsDir = 'components';
    if (existsSync(componentsDir)) {
      const hasComponents = this.hasFilesRecursively(componentsDir, '.tsx');
      this.addResult('Components exist', hasComponents);
    }

    // Check for key components
    const keyComponents = [
      'components/FoodItemRow.tsx',
      'components/MealSection.tsx',
      'components/NutritionSummary.tsx',
      'components/RecipeCard.tsx'
    ];

    keyComponents.forEach(component => {
      const exists = existsSync(component);
      this.addResult(`Component: ${component}`, exists);
    });
  }

  // Helper method to check for files recursively
  private hasFilesRecursively(dir: string, extension: string): boolean {
    try {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (this.hasFilesRecursively(fullPath, extension)) {
            return true;
          }
        } else if (item.endsWith(extension)) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // Validate environment configuration
  validateEnvironment(): void {
    this.log('\n🌍 Validating environment configuration...', 'info');
    
    const envFiles = ['.env', '.env.production'];
    envFiles.forEach(file => {
      const exists = existsSync(file);
      this.addResult(`Environment file: ${file}`, exists);
    });
  }

  // Run all validations
  async runAllValidations(): Promise<ValidationResult> {
    this.log('🚀 Starting comprehensive app validation...', 'info');
    
    this.validateFileStructure();
    this.validateRouting();
    this.validateComponents();
    this.validateBackend();
    this.validateEnvironment();
    this.validateDependencies();
    this.validateTypeScript();
    this.runTests();

    // Print summary
    this.log('\n📊 Validation Summary:', 'info');
    this.log(`Total tests: ${this.results.total}`, 'info');
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    this.log(`Success rate: ${successRate}%`, successRate === '100.0' ? 'success' : 'warning');

    if (this.results.failed > 0) {
      this.log('\n❌ Failed validations:', 'error');
      this.results.details
        .filter(d => d.status === 'fail')
        .forEach(d => {
          this.log(`  • ${d.name}${d.message ? ': ' + d.message : ''}`, 'error');
        });
    }

    return this.results;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new AppValidator();
  validator.runAllValidations()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

export default AppValidator;