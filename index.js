const express = require('express');
const { igdl } = require('btch-downloader');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Main Health Check Route
app.get('/', (req, res) => {
  res.send('Instasaver API is running successfully!');
});

// Download Route (No RapidAPI Needed)
app.get('/download', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ 
      status: false, 
      message: 'Please provide instagram url in query string (?url=...)' 
    });
  }

  try {
    const data = await igdl(videoUrl);

    if (data && data.length > 0) {
      return res.json({
        status: true,
        download_url: data[0].url || data[0],
        data: data
      });
    } else {
      return res.status(404).json({
        status: false,
        message: 'Could not extract video link. Make sure the account is public.'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
