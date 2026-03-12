const { execSync } = require('child_process');
try {
  const output = execSync('npm run build', { encoding: 'utf8' });
  console.log('Build successful:');
  console.log(output);
} catch (error) {
  console.error('Build failed:');
  console.error(error.stdout);
  console.error(error.stderr);
  process.exit(1);
}
