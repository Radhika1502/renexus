# Fix import paths in test files
$ErrorActionPreference = "Stop"
$logFile = "import_path_fixes_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
    Write-Host $Message
}

Write-Log "Starting import path fixes..."

# Create project.routes.ts in the correct location if it doesn't exist
$projectRoutesDir = ".\backend\services\projects"
$projectRoutesFile = Join-Path $projectRoutesDir "project.routes.ts"

if (-not (Test-Path $projectRoutesDir)) {
    Write-Log "Creating directory: $projectRoutesDir"
    New-Item -Path $projectRoutesDir -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path $projectRoutesFile)) {
    Write-Log "Creating project.routes.ts file"
    @"
import express from 'express';
import { authenticate } from '../../middleware/auth';
import { projectService } from './project.service';

const router = express.Router();

// Get all projects for the current tenant
router.get('/', authenticate, async (req, res, next) => {
  try {
    const projects = await projectService.getProjectsByTenant(req.user.tenantId);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Get a project by ID
router.get('/:projectId', authenticate, async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId, req.user.tenantId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Create a new project
router.post('/', authenticate, async (req, res, next) => {
  try {
    const project = await projectService.createProject({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Update a project
router.put('/:projectId', authenticate, async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.projectId,
      req.body,
      req.user.tenantId
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Delete a project
router.delete('/:projectId', authenticate, async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.projectId, req.user.tenantId);
    if (!result) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
"@ | Out-File -FilePath $projectRoutesFile -Encoding utf8
}

# Create project.service.ts in the correct location if it doesn't exist
$projectServiceFile = Join-Path $projectRoutesDir "project.service.ts"

if (-not (Test-Path $projectServiceFile)) {
    Write-Log "Creating project.service.ts file"
    @"
import { db } from '../../database/db';
import { projects } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

export const projectService = {
  // Get all projects for a tenant
  async getProjectsByTenant(tenantId: string) {
    return db.query.projects.findMany({
      where: eq(projects.tenantId, tenantId),
      orderBy: projects.name
    });
  },

  // Get a project by ID for a specific tenant
  async getProjectById(projectId: string, tenantId: string) {
    return db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.tenantId, tenantId)
      )
    });
  },

  // Create a new project
  async createProject(data: any) {
    const [project] = await db.insert(projects).values({
      name: data.name,
      description: data.description,
      status: data.status || 'active',
      startDate: data.startDate,
      dueDate: data.dueDate,
      tenantId: data.tenantId,
      createdBy: data.createdBy
    }).returning();
    
    return project;
  },

  // Update a project
  async updateProject(projectId: string, data: any, tenantId: string) {
    const [updatedProject] = await db.update(projects)
      .set({
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        dueDate: data.dueDate,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.tenantId, tenantId)
        )
      )
      .returning();
    
    return updatedProject;
  },

  // Delete a project
  async deleteProject(projectId: string, tenantId: string) {
    const [deletedProject] = await db.delete(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.tenantId, tenantId)
        )
      )
      .returning();
    
    return deletedProject;
  }
};
"@ | Out-File -FilePath $projectServiceFile -Encoding utf8
}

# Create auth guard in the correct location if it doesn't exist
$authGuardDir = ".\backend\api-gateway\src\auth"
$authGuardFile = Join-Path $authGuardDir "auth.guard.ts"

if (-not (Test-Path $authGuardDir)) {
    Write-Log "Creating directory: $authGuardDir"
    New-Item -Path $authGuardDir -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path $authGuardFile)) {
    Write-Log "Creating auth.guard.ts file"
    @"
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }
    
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'default_secret_for_development'
      });
      
      // Attach user to request
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
"@ | Out-File -FilePath $authGuardFile -Encoding utf8
}

# Fix import paths in test files
Write-Log "Fixing import paths in test files..."
$testFiles = Get-ChildItem -Path ".\tests" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"

foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    # Update database imports
    if ($content -match "../../database/db" -or $content -match "../database/db") {
        $content = $content -replace "../../database/db", "../../packages/database/db"
        $content = $content -replace "../database/db", "../packages/database/db"
        $modified = $true
    }
    
    # Update schema imports
    if ($content -match "../../database/schema" -or $content -match "../database/schema") {
        $content = $content -replace "../../database/schema", "../../packages/database/schema"
        $content = $content -replace "../database/schema", "../packages/database/schema"
        $modified = $true
    }
    
    # Update API gateway imports
    if ($content -match "../../api/gateway") {
        $content = $content -replace "../../api/gateway", "../../backend/api-gateway/gateway"
        $modified = $true
    }
    
    # Update auth guard imports
    if ($content -match "../../apps/api/src/auth/auth.guard") {
        $content = $content -replace "../../apps/api/src/auth/auth.guard", "../../backend/api-gateway/src/auth/auth.guard"
        $modified = $true
    }
    
    # Update middleware imports
    if ($content -match "../../middleware/auth") {
        $content = $content -replace "../../middleware/auth", "../../backend/middleware/auth"
        $modified = $true
    }
    
    # Update project routes imports
    if ($content -match "../../services/projects/project.routes") {
        $content = $content -replace "../../services/projects/project.routes", "../../backend/services/projects/project.routes"
        $modified = $true
    }
    
    # Update project service imports
    if ($content -match "../../services/projects/project.service") {
        $content = $content -replace "../../services/projects/project.service", "../../backend/services/projects/project.service"
        $modified = $true
    }
    
    if ($modified) {
        Write-Log "Updated import paths in: $($file.FullName)"
        Set-Content -Path $file.FullName -Value $content
    }
}

# Create symbolic links for backward compatibility
Write-Log "Creating symbolic links for backward compatibility..."

# Function to create a symbolic link
function Create-SymbolicLink {
    param (
        [string]$Source,
        [string]$Target
    )
    
    if (Test-Path $Source) {
        Write-Log "Source already exists, skipping symbolic link: $Source"
        return
    }
    
    if (-not (Test-Path $Target)) {
        Write-Log "Target does not exist, skipping symbolic link: $Target"
        return
    }
    
    try {
        $sourceParent = Split-Path -Path $Source -Parent
        if (-not (Test-Path $sourceParent)) {
            New-Item -Path $sourceParent -ItemType Directory -Force | Out-Null
        }
        
        Write-Log "Creating symbolic link: $Source -> $Target"
        cmd /c mklink /D $Source $Target
    } catch {
        Write-Log "Failed to create symbolic link: $_"
    }
}

# Create symbolic links for backward compatibility
Create-SymbolicLink -Source ".\services" -Target ".\backend\services"
Create-SymbolicLink -Source ".\database" -Target ".\packages\database"
Create-SymbolicLink -Source ".\middleware" -Target ".\backend\middleware"

Write-Log "Import path fixes completed successfully!" 