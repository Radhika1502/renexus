import { CustomFormula } from '../../types/analytics';
import { Task } from '../../types/task';

/**
 * FormulaBuilderService
 * 
 * Service for creating and evaluating custom analytics formulas
 */
class FormulaBuilderService {
  private static instance: FormulaBuilderService;
  private formulas: Map<string, CustomFormula> = new Map();
  
  private constructor() {
    // Private constructor for singleton pattern
    this.loadSampleFormulas();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): FormulaBuilderService {
    if (!FormulaBuilderService.instance) {
      FormulaBuilderService.instance = new FormulaBuilderService();
    }
    return FormulaBuilderService.instance;
  }
  
  /**
   * Load sample formulas
   */
  private loadSampleFormulas(): void {
    const sampleFormulas: CustomFormula[] = [
      {
        id: 'formula-1',
        name: 'Task Completion Ratio',
        formula: '(completedTasks / totalTasks) * 100',
        description: 'Percentage of completed tasks',
        variables: [
          { name: 'completedTasks', path: 'tasks.filter(t => t.status === "done").length' },
          { name: 'totalTasks', path: 'tasks.length' }
        ]
      },
      {
        id: 'formula-2',
        name: 'Average Delay',
        formula: 'overdueTasks.length > 0 ? totalDelayDays / overdueTasks.length : 0',
        description: 'Average delay in days for overdue tasks',
        variables: [
          { name: 'overdueTasks', path: 'tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done")' },
          { name: 'totalDelayDays', path: 'overdueTasks.reduce((sum, t) => sum + Math.ceil((new Date() - new Date(t.dueDate)) / (1000 * 60 * 60 * 24)), 0)' }
        ]
      },
      {
        id: 'formula-3',
        name: 'Efficiency Score',
        formula: 'completedTasks > 0 ? (estimatedHours / actualHours) * 100 : 0',
        description: 'Efficiency score based on estimated vs actual hours',
        variables: [
          { name: 'completedTasks', path: 'tasks.filter(t => t.status === "done" && t.estimatedHours && t.actualHours).length' },
          { name: 'estimatedHours', path: 'tasks.filter(t => t.status === "done" && t.estimatedHours && t.actualHours).reduce((sum, t) => sum + t.estimatedHours, 0)' },
          { name: 'actualHours', path: 'tasks.filter(t => t.status === "done" && t.estimatedHours && t.actualHours).reduce((sum, t) => sum + t.actualHours, 0)' }
        ]
      }
    ];
    
    sampleFormulas.forEach(formula => {
      this.formulas.set(formula.id, formula);
    });
  }
  
  /**
   * Get all formulas
   */
  public getAllFormulas(): CustomFormula[] {
    return Array.from(this.formulas.values());
  }
  
  /**
   * Get formula by ID
   */
  public getFormula(id: string): CustomFormula | undefined {
    return this.formulas.get(id);
  }
  
  /**
   * Create a new formula
   */
  public createFormula(formula: Omit<CustomFormula, 'id'>): CustomFormula {
    const id = `formula-${Date.now()}`;
    const newFormula: CustomFormula = {
      ...formula,
      id
    };
    
    this.formulas.set(id, newFormula);
    return newFormula;
  }
  
  /**
   * Update an existing formula
   */
  public updateFormula(id: string, formula: Partial<CustomFormula>): CustomFormula | undefined {
    const existingFormula = this.formulas.get(id);
    
    if (!existingFormula) {
      return undefined;
    }
    
    const updatedFormula: CustomFormula = {
      ...existingFormula,
      ...formula,
      id
    };
    
    this.formulas.set(id, updatedFormula);
    return updatedFormula;
  }
  
  /**
   * Delete a formula
   */
  public deleteFormula(id: string): boolean {
    return this.formulas.delete(id);
  }
  
  /**
   * Evaluate a formula with the given data
   */
  public evaluateFormula(formulaId: string, tasks: Task[]): number {
    const formula = this.formulas.get(formulaId);
    
    if (!formula) {
      throw new Error(`Formula with ID ${formulaId} not found`);
    }
    
    try {
      // Create a context with the variables
      const context: Record<string, any> = {
        tasks
      };
      
      // Evaluate each variable in the context
      formula.variables.forEach(variable => {
        try {
          // Use Function constructor to evaluate the path expression
          // This is a simplified approach - in a real app, you'd use a proper expression parser
          const evaluator = new Function('context', `with(context) { return ${variable.path}; }`);
          context[variable.name] = evaluator(context);
        } catch (error) {
          console.error(`Error evaluating variable ${variable.name}:`, error);
          context[variable.name] = 0;
        }
      });
      
      // Evaluate the formula with the variables
      const evaluator = new Function(...Object.keys(context), `return ${formula.formula};`);
      const result = evaluator(...Object.values(context));
      
      return typeof result === 'number' ? result : 0;
    } catch (error) {
      console.error(`Error evaluating formula ${formula.name}:`, error);
      return 0;
    }
  }
  
  /**
   * Validate a formula syntax
   */
  public validateFormula(formula: string, variables: string[]): { valid: boolean; error?: string } {
    try {
      // Create a function with the formula and variables
      new Function(...variables, `return ${formula};`);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid formula syntax'
      };
    }
  }
  
  /**
   * Get available task properties for formulas
   */
  public getAvailableTaskProperties(): { name: string; path: string; description: string }[] {
    return [
      { name: 'Total Tasks', path: 'tasks.length', description: 'Total number of tasks' },
      { name: 'Completed Tasks', path: 'tasks.filter(t => t.status === "done").length', description: 'Number of completed tasks' },
      { name: 'In Progress Tasks', path: 'tasks.filter(t => t.status === "in_progress").length', description: 'Number of in-progress tasks' },
      { name: 'Blocked Tasks', path: 'tasks.filter(t => t.status === "blocked").length', description: 'Number of blocked tasks' },
      { name: 'Todo Tasks', path: 'tasks.filter(t => t.status === "todo").length', description: 'Number of todo tasks' },
      { name: 'High Priority Tasks', path: 'tasks.filter(t => t.priority === "high").length', description: 'Number of high priority tasks' },
      { name: 'Overdue Tasks', path: 'tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length', description: 'Number of overdue tasks' },
      { name: 'Total Estimated Hours', path: 'tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)', description: 'Sum of all estimated hours' },
      { name: 'Total Actual Hours', path: 'tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)', description: 'Sum of all actual hours' },
      { name: 'Average Task Age', path: 'tasks.length > 0 ? tasks.reduce((sum, t) => sum + ((new Date() - new Date(t.createdAt)) / (1000 * 60 * 60 * 24)), 0) / tasks.length : 0', description: 'Average age of tasks in days' }
    ];
  }
}

export default FormulaBuilderService;
