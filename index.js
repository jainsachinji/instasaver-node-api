const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.send('Instasaver API is running successfully!');
});

// Download Route
app.get('/download', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ 
      status: false, 
      message: 'Please provide instagram url in query string (?url=...)' 
    });
  }

  const options = {
    method: 'GET',
    url: 'https://instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com/scraper',
    params: {
      url: videoUrl
    },
    headers: {
      'x-rapidapi-key': '4f90533d66msh27985cd1270197dp1dd37ejsn7125327ea0ef',
      'x-rapidapi-host': 'instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    res.json({
      status: true,
      data: response.data
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      status: false,
      message: error.message,
      error_details: error.response?.data || null
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
