const express = require('express');
const { igdl } = require('btch-downloader');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// HEALTH CHECK
// ===============================
app.get('/', (req, res) => {
    res.send('Instasaver API is running successfully!');
});

// ===============================
// HELPER: INSTAGRAM DATA
// ===============================
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
    } catch (error) {
        return null;
    }
}

// ===============================
// NORMAL SINGLE DOWNLOAD
// ===============================
app.get('/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;

        if (!videoUrl) {
            return res.status(400).json({
                status: false,
                message: 'Please provide instagram url'
            });
        }

        const mediaList = await fetchInstagramData(videoUrl);

        if (mediaList && mediaList.length > 0) {
            const downloadLink = mediaList[0].url || mediaList[0].path || mediaList[0];
            return res.json({
                status: true,
                download_url: downloadLink,
                data: mediaList
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'Could not extract Instagram media'
            });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});

// ===============================
// OPTIMIZED BATCH DOWNLOAD - GET (SKETCHWARE)
// ===============================
app.get('/batch-download-get', async (req, res) => {
    try {
        const encodedUrls = req.query.urls;

        if (!encodedUrls) {
            return res.status(400).json({
                status: false,
                message: 'No URLs provided'
            });
        }

        const urls = JSON.parse(decodeURIComponent(encodedUrls));

        if (!Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'Invalid URLs'
            });
        }

        const results = [];

        // Sequential One-by-One processing with 1s delay
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];

            try {
                const mediaList = await fetchInstagramData(url);

                if (mediaList && mediaList.length > 0) {
                    const downloadUrl = mediaList[0].url || mediaList[0].path || mediaList[0];

                    if (downloadUrl) {
                        results.push({
                            original_url: url,
                            status: true,
                            download_url: downloadUrl
                        });
                    } else {
                        results.push({
                            original_url: url,
                            status: false,
                            message: 'Download URL not found'
                        });
                    }
                } else {
                    results.push({
                        original_url: url,
                        status: false,
                        message: 'Instagram media extraction failed'
                    });
                }
            } catch (error) {
                results.push({
                    original_url: url,
                    status: false,
                    message: error.message
                });
            }

            // 1 Second delay between requests to avoid IP block
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const successCount = results.filter(item => item.status === true).length;

        return res.json({
            status: true,
            total: urls.length,
            success: successCount,
            failed: urls.length - successCount,
            results: results
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
             
