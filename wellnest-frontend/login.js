const API_BASE_URL = 'http://localhost:8080/api';

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      alert(`Login failed: ${errorText}`);
      return;
    }

    const data = await response.json();

    // CLEAR previous user data to prevent showing old age/weight/goal
    localStorage.clear();

    // Save token and user info to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('role', data.role);
    localStorage.setItem('fullName', data.fullName); // Use real name from DB

    // Store profile data if available (fallback to empty if not set)
    if (data.age) localStorage.setItem('age', data.age);
    if (data.weight) localStorage.setItem('weight', data.weight);
    if (data.goal) localStorage.setItem('goal', data.goal);
    if (data.trainerId) localStorage.setItem('trainerId', data.trainerId);

    localStorage.setItem('userEmail', email);

    console.log("Login successful:", data);
    alert("Login successful! Redirecting to dashboard...");

    if (data.role === 'TRAINER') {
      window.location.href = "trainer-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred during login. Please make sure the backend server is running.");
  }
}

// ============== FORGOT PASSWORD FUNCTIONALITY ==============

let resetEmailGlobal = '';
let resetOtpGlobal = '';

// Open forgot password modal
function openForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').classList.add('active');
  showStep(1);
  // Clear all fields
  document.getElementById('resetEmail').value = '';
  document.getElementById('otpCode').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}

// Close forgot password modal
function closeForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').classList.remove('active');
  resetEmailGlobal = '';
  resetOtpGlobal = '';
}

// Show specific step
function showStep(stepNumber) {
  document.getElementById('step1').style.display = stepNumber === 1 ? 'block' : 'none';
  document.getElementById('step2').style.display = stepNumber === 2 ? 'block' : 'none';
  document.getElementById('step3').style.display = stepNumber === 3 ? 'block' : 'none';
}

// Step 1: Send OTP
async function sendOtp() {
  const email = document.getElementById('resetEmail').value;

  if (!email) {
    alert('Please enter your email');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || data || 'Failed to send OTP');
      return;
    }

    resetEmailGlobal = email;
    document.getElementById('displayEmail').textContent = email;
    alert('OTP sent successfully! Check your email (or console for development).');
    showStep(2);

  } catch (error) {
    console.error('Error sending OTP:', error);
    alert('An error occurred while sending OTP. Please try again.');
  }
}

// Step 2: Verify OTP
async function verifyOtp() {
  const otp = document.getElementById('otpCode').value;

  if (!otp || otp.length !== 6) {
    alert('Please enter a valid 6-digit OTP');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: resetEmailGlobal,
        otp: otp
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || data || 'Invalid or expired OTP');
      return;
    }

    resetOtpGlobal = otp;
    alert('OTP verified successfully!');
    showStep(3);

  } catch (error) {
    console.error('Error verifying OTP:', error);
    alert('An error occurred while verifying OTP. Please try again.');
  }
}

// Step 3: Reset Password
async function resetPassword() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!newPassword || !confirmPassword) {
    alert('Please fill in all fields');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: resetEmailGlobal,
        otp: resetOtpGlobal,
        newPassword: newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || data || 'Failed to reset password');
      return;
    }

    alert('Password reset successful! You can now login with your new password.');
    closeForgotPasswordModal();

  } catch (error) {
    console.error('Error resetting password:', error);
    alert('An error occurred while resetting password. Please try again.');
  }
}

// Navigation functions
function backToStep1() {
  showStep(1);
}

function backToStep2() {
  showStep(2);
}
