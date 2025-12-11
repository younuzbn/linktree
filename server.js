const express = require('express');
const axios = require('axios');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || 'https://100.48.62.235';

// Create axios instance with SSL handling for IP-based connections
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
      const apiUrl = `${API_BASE_URL}/linktree/?BIS=${encodeURIComponent(BIS)}`;
      console.log(`Fetching from API: ${apiUrl}`);
      const response = await axiosInstance.get(apiUrl, {
        validateStatus: () => true, // Don't throw on any status
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      console.log(`API Response Status: ${response.status}`);
      
      if (response.status === 200 && response.headers['content-type']?.includes('text/html')) {
        // If API returns HTML, forward it
        res.setHeader('Content-Type', 'text/html');
        return res.send(response.data);
      } else if (response.status === 404 || response.status === 400) {
        // Handle error responses
        return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Tree - Not Found</title>
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
        h1 { color: #dc3545; margin-bottom: 16px; }
        p { color: #86868b; margin-bottom: 24px; }
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
        <p>No active link tree account found with BIS=${BIS}</p>
        <a href="/">← Back to Home</a>
    </div>
</body>
</html>
        `);
      } else {
        throw new Error('Unexpected response from API');
      }
    } catch (error) {
      console.error('Error fetching linktree:', error.message);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers
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
        h1 { color: #dc3545; margin-bottom: 16px; }
        p { color: #86868b; margin-bottom: 24px; }
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
        <a href="/">← Back to Home</a>
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
