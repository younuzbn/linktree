const express = require('express');
const axios = require('axios');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || 'https://100.48.62.235';

// Create axios instance with SSL handling for IP-based connections 1
// Since we're connecting to an IP address, SSL certificate validation will fail
// as certificates are issued for domain names, not IP addresses
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Disable SSL certificate validation for IP addresses
  })
});

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Home page - displays linktree based on BIS parameter
app.get('/', async (req, res) => {
  try {
    const BIS = req.query.BIS;
    
    if (!BIS) {
      return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kochi One - Home</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 24px;
            padding: 60px 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .logo {
            font-size: 64px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 24px;
            color: #1d1d1f;
            margin-bottom: 16px;
        }
        p {
            font-size: 16px;
            color: #86868b;
            margin-bottom: 40px;
        }
        .search-box {
            margin-top: 30px;
        }
        .search-input {
            width: 100%;
            padding: 16px;
            border: 2px solid #e5e5e7;
            border-radius: 12px;
            font-size: 16px;
            margin-bottom: 12px;
        }
        .search-input:focus {
            outline: none;
            border-color: #667eea;
        }
        .search-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .search-btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">kochi.one</div>
        <h1>Welcome</h1>
        <p>Enter a BIS number to view a link tree</p>
        <div class="search-box">
            <input type="text" id="bisInput" class="search-input" placeholder="Enter BIS (e.g., BIS00001)" maxlength="50">
            <button class="search-btn" onclick="searchBIS()">View Link Tree</button>
        </div>
    </div>
    <script>
        function searchBIS() {
            const bis = document.getElementById('bisInput').value.trim();
            if (bis) {
                window.location.href = '/?BIS=' + encodeURIComponent(bis);
            } else {
                alert('Please enter a BIS number');
            }
        }
        document.getElementById('bisInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBIS();
            }
        });
    </script>
</body>
</html>
      `);
    }
    
    // Fetch linktree data from API
    try {
      const apiUrl = `${API_BASE_URL}/api/public/linktree?BIS=${encodeURIComponent(BIS)}`;
      console.log(`Fetching linktree from API: ${apiUrl}`);
      
      const response = await axiosInstance.get(apiUrl, {
        validateStatus: () => true, // Don't throw on any status
        headers: {
          'Accept': 'application/json'
          // NO Content-Type header for GET requests
          // NO Authorization header - public endpoint
        }
      });
      
      console.log(`API Response Status: ${response.status}`);
      console.log('API Response Data:', JSON.stringify(response.data, null, 2));
      
      // Handle 404 - Account not found
      if (response.status === 404) {
        return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Tree Not Found</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        code {
            background: #f5f5f7;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Link Tree Not Found</h1>
        <p>No active link tree account found with <code>BIS=${escapeHtml(BIS)}</code></p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
        `);
      }
      
      // Handle 401 - Unauthorized
      if (response.status === 401) {
        console.error('API returned 401 Unauthorized. Response:', response.data);
        return res.status(500).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Error</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>API Authentication Error</h1>
        <p>The API endpoint requires authentication. Please check the endpoint configuration.</p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
        `);
      }
      
      // Handle other error statuses
      if (response.status !== 200) {
        console.error(`API returned status ${response.status}. Response:`, response.data);
        throw new Error(`API returned status ${response.status}`);
      }
      
      // Parse response
      const result = response.data;
      console.log('Parsed API Result:', JSON.stringify(result, null, 2));
      
      // Check if response has error status
      if (result && result.status === 'error') {
        console.error('API returned error status:', result.message);
        return res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Tree Not Found</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        code {
            background: #f5f5f7;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Link Tree Not Found</h1>
        <p>No active link tree account found with <code>BIS=${escapeHtml(BIS)}</code></p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
        `);
      }
      
      // Check if response has the expected structure
      if (result && result.status === 'success' && result.data && result.data.account) {
        const account = result.data.account;
        
        // Check for redirection - this must happen BEFORE rendering any content
        if (account.isRedirectionEnabled === true && account.redirectionUrl) {
          const redirectUrl = account.redirectionUrl.trim();
          
          // Validate URL before redirecting
          if (isValidUrl(redirectUrl)) {
            console.log(`Redirecting to: ${redirectUrl}`);
            return res.redirect(302, redirectUrl);
          } else {
            console.warn(`Invalid redirection URL: ${redirectUrl}`);
            // Continue to render page if URL is invalid
          }
        }
        
        // Sort buttons by order
        const sortedButtons = account.buttons ? [...account.buttons].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
        
        // Generate HTML for link tree page
        // Construct loading image URL from BIS parameter
        const loadingImageUrl = `https://raw.githubusercontent.com/younuzbn/kochionereviewloadingasset/main/${escapeHtml(BIS)}.png`;
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(account.accountName || 'Link Tree')} - kochi.one</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #1d1d1f;
            min-height: 100vh;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .loading-screen.hidden {
            opacity: 0;
            visibility: hidden;
        }
        .loading-screen img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
        }
        .container {
            max-width: 600px;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .banner {
            width: 100%;
            max-width: 600px;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 32px;
            display: ${account.bannerImage && account.bannerImage.url && !account.isBannerHidden ? 'block' : 'none'};
        }
        .banner img {
            width: 100%;
            height: auto;
            display: block;
            object-fit: cover;
        }
        .account-name {
            font-size: 32px;
            font-weight: 600;
            color: #1d1d1f;
            text-align: center;
            margin-bottom: 40px;
            line-height: 1.2;
        }
        .buttons-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 40px;
        }
        .button-link {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            background: #ffffff;
            border: 1.5px solid #e5e5e7;
            border-radius: 12px;
            text-decoration: none;
            color: #1d1d1f;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .button-link:hover {
            border-color: #86868b;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .button-icon {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .button-icon img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }
        .button-label {
            font-size: 16px;
            font-weight: 500;
            flex: 1;
            text-align: left;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #86868b;
            font-size: 16px;
        }
        .footer {
            margin-top: auto;
            padding-top: 40px;
            text-align: center;
            color: #86868b;
            font-size: 14px;
        }
        .footer a {
            color: #000000;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-size: 16px;
            color: #86868b;
        }
    </style>
</head>
<body>
    <div class="loading-screen" id="loadingScreen">
        <img src="${loadingImageUrl}" alt="Loading..." onerror="this.parentElement.style.display='none';">
    </div>
    <div class="container">
        ${account.bannerImage && account.bannerImage.url && !account.isBannerHidden ? `
        <div class="banner">
            <img src="${escapeHtml(account.bannerImage.url)}" alt="Banner" onerror="this.style.display='none';">
        </div>
        ` : ''}
        
        <h1 class="account-name">${escapeHtml(account.accountName || 'Link Tree')}</h1>
        
        <div class="buttons-container">
            ${sortedButtons.length > 0 ? sortedButtons.map(button => {
                const iconHtml = button.icon && button.icon.url 
                    ? `<img src="${escapeHtml(button.icon.url)}" alt="${escapeHtml(button.label || '')}" onerror="this.parentElement.innerHTML='🔗';">`
                    : '🔗';
                const label = escapeHtml(button.label || 'Link');
                const link = escapeHtml(button.link || '#');
                
                return `
            <a href="${link}" class="button-link" target="_blank" rel="noopener noreferrer">
                <div class="button-icon">${iconHtml}</div>
                <div class="button-label">${label}</div>
            </a>
                `;
            }).join('') : `
            <div class="empty-state">
                No buttons added yet. Add buttons from the admin panel.
            </div>
            `}
        </div>
        
        <div class="footer">
            <a href="https://www.kochi.one" target="_blank" rel="noopener noreferrer">www.kochi.one</a>
        </div>
    </div>
    <script>
        // Hide loading screen when page is fully loaded
        window.addEventListener('load', function() {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                setTimeout(function() {
                    loadingScreen.classList.add('hidden');
                    // Remove from DOM after animation
                    setTimeout(function() {
                        loadingScreen.remove();
                    }, 300);
                }, 1500); // Minimum 1.5 seconds display time
            }
        });
    </script>
</body>
</html>
        `;
        
        return res.send(html);
      } else {
        // Unexpected response structure
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Error fetching linktree:', error.message);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      });
      
      return res.status(500).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Error</h1>
        <p>Unable to load link tree. Please try again later.</p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
      `);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Helper function to validate URL
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Link Tree Public View Route
app.get('/linktree', async (req, res) => {
  try {
    const BIS = req.query.BIS;
    
    // Check if BIS parameter is provided
    if (!BIS) {
      return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Missing BIS Parameter</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        code {
            background: #f5f5f7;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Missing BIS Parameter</h1>
        <p>Please provide a BIS parameter in the URL.</p>
        <p style="margin-top: 16px;"><code>Example: /linktree?BIS=1</code></p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
      `);
    }
    
    // Fetch linktree data from API
    try {
      const apiUrl = `${API_BASE_URL}/api/public/linktree?BIS=${encodeURIComponent(BIS)}`;
      console.log(`Fetching linktree from API: ${apiUrl}`);
      
      const response = await axiosInstance.get(apiUrl, {
        validateStatus: () => true, // Don't throw on any status
        headers: {
          'Accept': 'application/json'
          // NO Content-Type header for GET requests
          // NO Authorization header - public endpoint
        }
      });
      
      console.log(`API Response Status: ${response.status}`);
      console.log('API Response Data:', JSON.stringify(response.data, null, 2));
      
      // Handle 404 - Account not found
      if (response.status === 404) {
        return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Tree Not Found</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        code {
            background: #f5f5f7;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Link Tree Not Found</h1>
        <p>No active link tree account found with <code>BIS=${escapeHtml(BIS)}</code></p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
        `);
      }
      
      // Handle 401 - Unauthorized
      if (response.status === 401) {
        console.error('API returned 401 Unauthorized. Response:', response.data);
        return res.status(500).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Error</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>API Authentication Error</h1>
        <p>The API endpoint requires authentication. Please check the endpoint configuration.</p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
        `);
      }
      
      // Handle other error statuses
      if (response.status !== 200) {
        console.error(`API returned status ${response.status}. Response:`, response.data);
        throw new Error(`API returned status ${response.status}`);
      }
      
      // Parse response
      const result = response.data;
      console.log('Parsed API Result:', JSON.stringify(result, null, 2));
      
      // Check if response has error status
      if (result && result.status === 'error') {
        console.error('API returned error status:', result.message);
        return res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Tree Not Found</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        code {
            background: #f5f5f7;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Link Tree Not Found</h1>
        <p>No active link tree account found with <code>BIS=${escapeHtml(BIS)}</code></p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
        `);
      }
      
      // Check if response has the expected structure
      if (result && result.status === 'success' && result.data && result.data.account) {
        const account = result.data.account;
        
        // Check for redirection - this must happen BEFORE rendering any content
        if (account.isRedirectionEnabled === true && account.redirectionUrl) {
          const redirectUrl = account.redirectionUrl.trim();
          
          // Validate URL before redirecting
          if (isValidUrl(redirectUrl)) {
            console.log(`Redirecting to: ${redirectUrl}`);
            return res.redirect(302, redirectUrl);
          } else {
            console.warn(`Invalid redirection URL: ${redirectUrl}`);
            // Continue to render page if URL is invalid
          }
        }
        
        // Sort buttons by order
        const sortedButtons = account.buttons ? [...account.buttons].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
        
        // Generate HTML for link tree page
        // Construct loading image URL from BIS parameter
        const loadingImageUrl = `https://raw.githubusercontent.com/younuzbn/kochionereviewloadingasset/main/${escapeHtml(BIS)}.png`;
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(account.accountName || 'Link Tree')} - kochi.one</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #1d1d1f;
            min-height: 100vh;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .loading-screen.hidden {
            opacity: 0;
            visibility: hidden;
        }
        .loading-screen img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
        }
        .container {
            max-width: 600px;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .banner {
            width: 100%;
            max-width: 600px;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 32px;
            display: ${account.bannerImage && account.bannerImage.url && !account.isBannerHidden ? 'block' : 'none'};
        }
        .banner img {
            width: 100%;
            height: auto;
            display: block;
            object-fit: cover;
        }
        .account-name {
            font-size: 32px;
            font-weight: 600;
            color: #1d1d1f;
            text-align: center;
            margin-bottom: 40px;
            line-height: 1.2;
        }
        .buttons-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 40px;
        }
        .button-link {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            background: #ffffff;
            border: 1.5px solid #e5e5e7;
            border-radius: 12px;
            text-decoration: none;
            color: #1d1d1f;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .button-link:hover {
            border-color: #86868b;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .button-icon {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .button-icon img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }
        .button-label {
            font-size: 16px;
            font-weight: 500;
            flex: 1;
            text-align: left;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #86868b;
            font-size: 16px;
        }
        .footer {
            margin-top: auto;
            padding-top: 40px;
            text-align: center;
            color: #86868b;
            font-size: 14px;
        }
        .footer a {
            color: #000000;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-size: 16px;
            color: #86868b;
        }
    </style>
</head>
<body>
    <div class="loading-screen" id="loadingScreen">
        <img src="${loadingImageUrl}" alt="Loading..." onerror="this.parentElement.style.display='none';">
    </div>
    <div class="container">
        ${account.bannerImage && account.bannerImage.url && !account.isBannerHidden ? `
        <div class="banner">
            <img src="${escapeHtml(account.bannerImage.url)}" alt="Banner" onerror="this.style.display='none';">
        </div>
        ` : ''}
        
        <h1 class="account-name">${escapeHtml(account.accountName || 'Link Tree')}</h1>
        
        <div class="buttons-container">
            ${sortedButtons.length > 0 ? sortedButtons.map(button => {
                const iconHtml = button.icon && button.icon.url 
                    ? `<img src="${escapeHtml(button.icon.url)}" alt="${escapeHtml(button.label || '')}" onerror="this.parentElement.innerHTML='🔗';">`
                    : '🔗';
                const label = escapeHtml(button.label || 'Link');
                const link = escapeHtml(button.link || '#');
                
                return `
            <a href="${link}" class="button-link" target="_blank" rel="noopener noreferrer">
                <div class="button-icon">${iconHtml}</div>
                <div class="button-label">${label}</div>
            </a>
                `;
            }).join('') : `
            <div class="empty-state">
                No buttons added yet. Add buttons from the admin panel.
            </div>
            `}
        </div>
        
        <div class="footer">
            <a href="https://www.kochi.one" target="_blank" rel="noopener noreferrer">www.kochi.one</a>
        </div>
    </div>
    <script>
        // Hide loading screen when page is fully loaded
        window.addEventListener('load', function() {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                setTimeout(function() {
                    loadingScreen.classList.add('hidden');
                    // Remove from DOM after animation
                    setTimeout(function() {
                        loadingScreen.remove();
                    }, 300);
                }, 1500); // Minimum 1.5 seconds display time
            }
        });
    </script>
</body>
</html>
        `;
        
        return res.send(html);
      } else {
        // Unexpected response structure
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Error fetching linktree:', error.message);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      });
      
      return res.status(500).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        h1 { color: #dc3545; margin-bottom: 16px; font-size: 24px; }
        p { color: #86868b; margin-bottom: 24px; font-size: 16px; }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Error</h1>
        <p>Unable to load link tree. Please try again later.</p>
        <a href="/" style="display: inline-block; margin-top: 24px;">← Back to Home</a>
    </div>
</body>
</html>
      `);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Home server running on http://localhost:${PORT}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
});
