/**
 * Direct database connection test
 * This script directly tests database connections and real data operations
 */

const { testDb } = require('./setup/test-db');

async function runDbTest() {
  console.log('=== STARTING DIRECT DATABASE TEST ===');
  console.log('Attempting to connect to database...');
  
  try {
    // Test query - simple select to verify connection
    const result = await testDb.execute('SELECT NOW() as current_time');
    console.log('✓ Database connection successful!');
    console.log(`Current database time: ${result.rows[0].current_time}`);
    
    // Test project creation
    console.log('\nTesting project creation...');
    const projectName = `Test Project ${Date.now()}`;
    const createResult = await testDb.execute(
      `INSERT INTO projects (
        id, name, description, status, priority, tenant_id, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING id, name, description, status`,
      [
        `test-${Date.now()}`, // Generate unique ID
        projectName,
        'Project created for direct database test',
        'planning',
        'medium',
        'test-tenant-1',
        'test-user-1'
      ]
    );
    
    if (createResult.rows.length > 0) {
      const project = createResult.rows[0];
      console.log('✓ Project created successfully:');
      console.log(JSON.stringify(project, null, 2));
      
      // Clean up by deleting the project
      const deleteResult = await testDb.execute(
        'DELETE FROM projects WHERE id = $1',
        [project.id]
      );
      
      console.log(`✓ Project cleanup successful (${deleteResult.rowCount} rows deleted)`);
    } else {
      console.log('! Project creation failed - no rows returned');
    }
    
    // Check if we're using real database or mock
    console.log(`\nUsing: ${testDb.isUsingRealDb ? 'REAL DATABASE' : 'MOCK DATABASE'}`);
    
    return true;
  } catch (error) {
    console.error('! Database test failed with error:');
    console.error(error);
    return false;
  } finally {
    try {
      await testDb.close();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
    console.log('=== DATABASE TEST COMPLETE ===');
  }
}

// Run the test
runDbTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error in test:', err);
    process.exit(1);
  });
