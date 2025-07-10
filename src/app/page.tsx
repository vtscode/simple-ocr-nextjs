"use client";

import { useState } from 'react';
import { Button, TextField, Typography, Box, LinearProgress, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import Tesseract from 'tesseract.js';

// Definisikan tipe untuk state yang menyimpan stream kamera
type VideoStream = MediaStream | null;

export default function Home() {
  const [ocrResult, setOcrResult] = useState<string>(''); // Tipe hasil OCR
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Menyimpan status proses
  const [imageSrc, setImageSrc] = useState<string | null>(null); // Menyimpan gambar yang di-upload
  const [videoStream, setVideoStream] = useState<VideoStream>(null); // Menyimpan stream kamera
  const [language, setLanguage] = useState<string>('eng'); // Menyimpan bahasa OCR yang dipilih
  const [progress, setProgress] = useState<number>(0); // Menyimpan progress OCR

  // Menambahkan tipe untuk event pada fungsi handleFileChange
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string); // Konversi ke string base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = () => {
    if (imageSrc) {
      setIsProcessing(true);
      setProgress(0); // Reset progress
      Tesseract.recognize(
        imageSrc,
        language, // Gunakan bahasa yang dipilih
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(m.progress * 100); // Update progress
            }
          },
        }
      ).then(({ data: { text } }) => {
        setOcrResult(text);
        setIsProcessing(false);
      }).catch((error) => {
        console.error('OCR error:', error);
        setIsProcessing(false);
      });
    }
  };

  const startCamera = () => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          setVideoStream(stream); // Menyimpan stream kamera
          const videoElement = document.getElementById('video') as HTMLVideoElement;
          videoElement.srcObject = stream;
          videoElement.play();
        })
        .catch((err) => {
          console.log('Error accessing camera:', err);
        });
    } else {
      alert('Webcam not supported.');
    }
  };

  const captureImageFromCamera = () => {
    const videoElement = document.getElementById('video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx && videoElement) {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const capturedImage = canvas.toDataURL('image/png');
      setImageSrc(capturedImage);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ocrResult).then(() => {
      alert('OCR result copied to clipboard!');
    });
  };

  const downloadTextFile = () => {
    const blob = new Blob([ocrResult], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ocr_result_${Date.now()}.txt`;
    link.click();
  };

  return (
    <Box sx={{ textAlign: 'center', marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>OCR Scanner</Typography>

      {/* Dropdown untuk memilih bahasa */}
      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel id="language-label">Language</InputLabel>
        <Select
          labelId="language-label"
          value={language}
          label="Language"
          onChange={(e) => setLanguage(e.target.value)}
        >
          <MenuItem value="eng">English</MenuItem>
          <MenuItem value="ind">Indonesian</MenuItem>
          <MenuItem value="fra">French</MenuItem>
          <MenuItem value="spa">Spanish</MenuItem>
          <MenuItem value="deu">German</MenuItem>
          {/* Tambah pilihan bahasa lain sesuai kebutuhan */}
        </Select>
      </FormControl>

      {/* Tombol Akses Kamera */}
      <Box>
        <Button variant="contained" onClick={startCamera}>Access Camera</Button>
      </Box>

      {/* Upload File */}
      <Box sx={{ marginTop: 2 }}>
        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
        <Button variant="contained" onClick={handleFileUpload} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Upload & Scan'}
        </Button>
      </Box>

      {/* Camera Stream */}
      {videoStream && (
        <Box sx={{ marginTop: 2 }}>
          <video id="video" width="320" height="240" style={{ border: '1px solid #ccc' }}></video>
          <Button variant="contained" onClick={captureImageFromCamera} sx={{ marginTop: 2 }}>
            Capture Image
          </Button>
        </Box>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <Box sx={{ marginTop: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2">{`Processing... ${Math.round(progress)}%`}</Typography>
        </Box>
      )}

      {/* OCR Result */}
      <Box sx={{ marginTop: 4 }}>
        <Typography variant="h6">OCR Result:</Typography>
        <TextField
          value={ocrResult}
          multiline
          rows={6}
          variant="outlined"
          fullWidth
          InputProps={{
            readOnly: true,
          }}
        />
      </Box>

      {/* Actions */}
      <Box sx={{ marginTop: 2 }}>
        <Button variant="contained" onClick={copyToClipboard} disabled={!ocrResult}>
          Copy to Clipboard
        </Button>
        <Button variant="contained" onClick={downloadTextFile} disabled={!ocrResult} sx={{ marginLeft: 2 }}>
          Download as .txt
        </Button>
      </Box>
    </Box>
  );
}
