@echo off
npx jest src/features/task-management/components/__tests__/BasicTest.test.tsx --no-cache > test-output.txt 2>&1
type test-output.txt
