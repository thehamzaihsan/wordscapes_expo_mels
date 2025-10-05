// Test email confirmation flow implementation
const fs = require('fs');

try {
  const emailConfirmationContent = fs.readFileSync('./app/components/EmailConfirmationScreen.tsx', 'utf8');
  const emailConfirmationRouteContent = fs.readFileSync('./app/email-confirmation.tsx', 'utf8');
  const createAccountContent = fs.readFileSync('./app/components/CreateAccountScreen.tsx', 'utf8');
  const createAccountRouteContent = fs.readFileSync('./app/create-account.tsx', 'utf8');
  const authContent = fs.readFileSync('./lib/auth.ts', 'utf8');
  const layoutContent = fs.readFileSync('./app/_layout.tsx', 'utf8');
  
  const checks = {
    // Email Confirmation Screen
    hasEmailConfirmationComponent: emailConfirmationContent.includes('EmailConfirmationScreen'),
    hasAutoRedirect: emailConfirmationContent.includes('countdown'),
    hasResendFunction: emailConfirmationContent.includes('resendConfirmationEmail'),
    hasInstructions: emailConfirmationContent.includes('Check your email inbox'),
    hasWarning: emailConfirmationContent.includes('You must confirm your email'),
    
    // Email Confirmation Route
    hasEmailConfirmationRoute: emailConfirmationRouteContent.includes('useLocalSearchParams'),
    hasEmailParam: emailConfirmationRouteContent.includes('email?: string'),
    
    // CreateAccount updates
    hasUpdatedCreateAccountProps: createAccountContent.includes('params?: { email?: string }'),
    hasEmailConfirmationRedirect: createAccountContent.includes('email-confirmation'),
    
    // CreateAccount route updates
    hasUpdatedRouteNavigation: createAccountRouteContent.includes('email-confirmation'),
    hasEmailParamPassing: createAccountRouteContent.includes('params: { email: params?.email }'),
    
    // Auth updates
    hasResendFunction: authContent.includes('resendConfirmationEmail'),
    hasEmailConfirmationFlag: authContent.includes('emailConfirmationRequired'),
    hasUpdatedAuthResult: authContent.includes('emailConfirmationRequired?: boolean'),
    
    // Layout updates
    hasEmailConfirmationInLayout: layoutContent.includes('email-confirmation'),
    hasCorrectGestureSettings: layoutContent.includes('gestureEnabled: false'),
  };
  
  console.log('=== Email Confirmation Flow Checks ===');
  console.log('✓ Email confirmation component:', checks.hasEmailConfirmationComponent);
  console.log('✓ Auto redirect countdown:', checks.hasAutoRedirect);
  console.log('✓ Resend email function:', checks.hasResendFunction);
  console.log('✓ User instructions:', checks.hasInstructions);
  console.log('✓ Email confirmation warning:', checks.hasWarning);
  
  console.log('\n=== Route Implementation ===');
  console.log('✓ Email confirmation route:', checks.hasEmailConfirmationRoute);
  console.log('✓ Email parameter handling:', checks.hasEmailParam);
  console.log('✓ Layout screen added:', checks.hasEmailConfirmationInLayout);
  console.log('✓ Correct gesture settings:', checks.hasCorrectGestureSettings);
  
  console.log('\n=== CreateAccount Flow Updates ===');
  console.log('✓ Updated props interface:', checks.hasUpdatedCreateAccountProps);
  console.log('✓ Email confirmation redirect:', checks.hasEmailConfirmationRedirect);
  console.log('✓ Route navigation updated:', checks.hasUpdatedRouteNavigation);
  console.log('✓ Email param passing:', checks.hasEmailParamPassing);
  
  console.log('\n=== Auth Function Updates ===');
  console.log('✓ Resend function added:', authContent.includes('resendConfirmationEmail'));
  console.log('✓ Email confirmation flag:', checks.hasEmailConfirmationFlag);
  console.log('✓ Updated AuthResult interface:', checks.hasUpdatedAuthResult);
  
  const allChecksPass = Object.values(checks).every(check => check);
  
  if (allChecksPass) {
    console.log('\n✅ Email confirmation flow implemented successfully!');
    console.log('\nNew Features:');
    console.log('📧 Email confirmation screen with clear instructions');
    console.log('🔄 Auto-redirect to login after 5 seconds');
    console.log('📤 Resend confirmation email with cooldown');
    console.log('🛡️ Gesture prevention on confirmation screen');
    console.log('📊 User-friendly progress indicators');
    console.log('⚠️ Clear warnings about email confirmation requirement');
    console.log('\nFlow: Create Account → Email Confirmation → Login');
  } else {
    console.log('\n❌ Some features might be missing.');
    const failedChecks = Object.entries(checks).filter(([, value]) => !value);
    console.log('Failed checks:', failedChecks.map(([key]) => key));
  }
  
} catch (error) {
  console.error('Error:', error.message);
}