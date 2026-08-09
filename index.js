const express = require('express');
const { igdl } = require('btch-downloader');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send('Instasaver API is running successfully!');
});

// Helper function to extract media array safely
async function fetchInstagramData(videoUrl) {
  try {
    const decodedUrl = decodeURIComponent(videoUrl);
    const data = await igdl(decodedUrl);

    let mediaList = [];
    if (Array.isArray(data)) {
      mediaList = data;
    } else if (data && data.result && Array.isArray(data.result)) {
      mediaList = data.result;
    } else if (data && typeof data === 'object') {
      mediaList = [data];
    }
    return mediaList;
  } catch (err) {
    return null;
  }
}

// 1. Single Download Route (Existing - No Breaking Change)
app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url;

    if (!videoUrl) {
      return res.status(400).json({ 
        status: false, 
        message: 'Please provide instagram url in query string (?url=...)' 
      });
    }

    const mediaList = await fetchInstagramData(videoUrl);

    if (mediaList && mediaList.length > 0) {
      const downloadLink = mediaList[0].url || mediaList[0].path || mediaList[0];
      return res.json({
        status: true,
        download_url: downloadLink,
        data: mediaList // Return full array for Carousel posts
      });
    } else {
      return res.status(404).json({
        status: false,
        message: 'Could not extract video link. Account might be private or rate-limited.'
      });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// 2. NEW: Batch Download Route (Multiple Instagram Links)
app.post('/batch-download', async (req, res) => {
  try {
    const { urls } = req.body; // Expects JSON body: { "urls": ["url1", "url2"] }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Please provide an array of URLs in body: { "urls": [...] }'
      });
    }

    // Process all URLs in parallel
    const results = await Promise.all(
      urls.map(async (url) => {
        const mediaList = await fetchInstagramData(url);
        if (mediaList && mediaList.length > 0) {
          return {
            url: url,
            status: true,
            download_url: mediaList[0].url || mediaList[0].path || mediaList[0],
            data: mediaList
          };
        } else {
          return {
            url: url,
            status: false,
            message: 'Failed to extract'
          };
        }
      })
    );

    return res.json({
      status: true,
      total: urls.length,
      results: results
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
