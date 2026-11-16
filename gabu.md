<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy 1st Birthday Gabu!</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
  <style>
      * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
      }

      body {
          font-family: 'Nunito', sans-serif;
          background: linear-gradient(135deg, #f9f4ff 0%, #eef9ff 100%);
          color: #333;
          line-height: 1.6;
          padding: 20px;
          min-height: 100vh;
      }

      .container {
          max-width: 1200px;
          margin: 0 auto;
      }

      header {
          text-align: center;
          padding: 30px 20px;
          background: linear-gradient(120deg, #ff9a9e 0%, #fad0c4 100%);
          border-radius: 20px;
          margin-bottom: 30px;
          box-shadow: 0 8px 20px rgba(255, 154, 158, 0.2);
          position: relative;
          overflow: hidden;
      }

      header::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23ffffff" opacity="0.2"><path d="M20,20 Q40,5 60,20 T100,20 V80 Q80,95 60,80 T20,80 Z"/></svg>') repeat;
          animation: float 20s linear infinite;
          z-index: 0;
      }

      h1 {
          font-family: 'Comic Neue', cursive;
          font-size: 2.8rem;
          color: #7b4397;
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
      }

      .birthday-message {
          font-size: 1.3rem;
          max-width: 800px;
          margin: 0 auto 20px;
          background-color: rgba(255, 255, 255, 0.8);
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          position: relative;
          z-index: 1;
          line-height: 1.8;
      }

      .birthday-message span {
          background-color: #fffacd;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          color: #e74c3c;
      }

      .main-content {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          margin-bottom: 40px;
      }

      .form-section {
          flex: 1;
          min-width: 300px;
          background-color: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      }

      .gallery-section {
          flex: 1;
          min-width: 300px;
          background-color: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      }

      h2 {
          color: #7b4397;
          margin-bottom: 20px;
          font-family: 'Comic Neue', cursive;
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          gap: 10px;
      }

      h2 i {
          color: #ff9a9e;
      }

      .form-group {
          margin-bottom: 25px;
      }

      label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #555;
      }

      input[type="text"] {
          width: 100%;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s;
      }

      input[type="text"]:focus {
          border-color: #ff9a9e;
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 154, 158, 0.2);
      }

      .audio-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 25px;
      }

      .audio-btn {
          padding: 15px 25px;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          flex: 1;
          min-width: 140px;
      }

      .record-btn {
          background-color: #ff6b6b;
          color: white;
      }

      .record-btn:hover {
          background-color: #ff5252;
          transform: translateY(-3px);
      }

      .record-btn.recording {
          background-color: #ff3838;
          animation: pulse 1.5s infinite;
      }

      .stop-btn {
          background-color: #4ecdc4;
          color: white;
      }

      .stop-btn:hover {
          background-color: #3dbdb4;
          transform: translateY(-3px);
      }

      .play-btn {
          background-color: #45b7d1;
          color: white;
      }

      .play-btn:hover {
          background-color: #35a7c1;
          transform: translateY(-3px);
      }

      .timer {
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 10px;
          margin-bottom: 20px;
          color: #7b4397;
      }

      .audio-visualizer {
          height: 80px;
          width: 100%;
          background-color: #f8f9fa;
          border-radius: 10px;
          margin-bottom: 20px;
          overflow: hidden;
          position: relative;
      }

      .visualizer-bar {
          position: absolute;
          bottom: 0;
          width: 8px;
          background-color: #ff9a9e;
          border-radius: 4px 4px 0 0;
          transition: height 0.2s;
      }

      .submit-btn {
          width: 100%;
          padding: 18px;
          background-color: #7b4397;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0.5;
          pointer-events: none;
      }

      .submit-btn.active {
          opacity: 1;
          pointer-events: auto;
          background: linear-gradient(to right, #7b4397, #dc2430);
      }

      .submit-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 7px 15px rgba(123, 67, 151, 0.3);
      }

      .submit-btn.active:hover {
          background: linear-gradient(to right, #8b53a7, #ec3440);
      }

      .audio-player {
          width: 100%;
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 10px;
          display: none;
      }

      .audio-player.active {
          display: block;
      }

      .audio-player audio {
          width: 100%;
          margin-top: 10px;
      }

      .gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 15px;
          margin-top: 20px;
      }

      /* Gallery item: fixed-height box. Use a dark background so portrait images that
         don't fill the width show dark bars on left/right. Use flex centering so the
         image is centered and fully visible. */
      .gallery-item {
          border-radius: 12px;
          overflow: hidden;
          height: 220px; /* fixed height - adjust as desired */
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #111; /* dark background for letterboxing */
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
      }

      .gallery-item:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
      }

      /* Ensure images are fully visible (no cropping). For portrait images this
         will leave dark space to the left/right provided by the .gallery-item background. */
      .gallery-item img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          display: block;
          object-fit: contain; /* supported by modern browsers */
      }

      /* Lightbox overlay styles */
      .lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
      }

      .lightbox-overlay.active {
          display: flex;
      }

      .lightbox-content {
          position: relative;
          max-width: 95vw;
          max-height: 95vh;
          display: flex;
          align-items: center;
          justify-content: center;
      }

      .lightbox-img {
          max-width: 90%;
          max-height: 90%;
          width: auto;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      }

      .lightbox-close,
      .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          color: #fff;
          background: rgba(0,0,0,0.4);
          border: none;
          padding: 12px;
          cursor: pointer;
          border-radius: 6px;
      }

      .lightbox-close {
          top: 12px;
          right: 12px;
          transform: none;
          font-size: 18px;
          padding: 8px 10px;
      }

      .lightbox-nav.left { left: 12px; }
      .lightbox-nav.right { right: 12px; }

      .lightbox-nav { font-size: 20px; }

      footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 0.9rem;
          margin-top: 20px;
      }

      .banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 20px;
          background-color: #fffacd;
          padding: 15px;
          border-radius: 15px;
          border-left: 6px solid #ff9a9e;
      }

      .banner i {
          font-size: 1.5rem;
          color: #e74c3c;
      }

      @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
      }

      @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-50px, -50px) rotate(360deg); }
      }

      @media (max-width: 768px) {
          .main-content {
              flex-direction: column;
          }

          h1 {
              font-size: 2.2rem;
          }

          .birthday-message {
              font-size: 1.1rem;
          }

          .audio-btn {
              min-width: 100%;
          }
      }
  </style>
</head>
<body>
<div class="container">
  <header>
    <h1><i class="fas fa-birthday-cake"></i> Happy 1st Birthday, Gabu! <i class="fas fa-birthday-cake"></i></h1>
    <div class="birthday-message">
      Hello family and friends! As Gabu turns one, please record a small audio message for him.
      We may not all be together today but we can all come together <span>digitally</span> to celebrate his birthday.
      Thank you in advance for your warm messages!
    </div>
  </header>

  <div class="banner">
    <i class="fas fa-microphone-alt"></i>
    <div>Record a birthday wish for Gabu! Your message should be at least 10 seconds long.</div>
  </div>

  <div class="main-content">
    <section class="form-section">
      <h2><i class="fas fa-gift"></i> Record Your Birthday Message</h2>

      <form id="messageForm">
        <div class="form-group">
          <label for="name"><i class="fas fa-user"></i> Your Name:</label>
          <input type="text" id="name" name="name" placeholder="Enter your name" required>
        </div>

        <div class="timer" id="timer">00:00</div>

        <div class="audio-visualizer" id="visualizer">
          <!-- Visualizer bars will be generated by JavaScript -->
        </div>

        <div class="audio-controls">
          <button type="button" class="audio-btn record-btn" id="recordBtn">
            <i class="fas fa-microphone"></i> Start Recording
          </button>
          <button type="button" class="audio-btn stop-btn" id="stopBtn" disabled>
            <i class="fas fa-stop"></i> Stop Recording
          </button>
          <button type="button" class="audio-btn play-btn" id="playBtn" disabled>
            <i class="fas fa-play"></i> Playback
          </button>
        </div>

        <div class="audio-player" id="audioPlayer">
          <p><strong>Your recorded message:</strong></p>
          <audio id="recordedAudio" controls>
            Your browser does not support the audio element.
          </audio>
        </div>

        <button type="submit" class="submit-btn" id="submitBtn" disabled>
          <i class="fas fa-paper-plane"></i> Submit Your Recording
        </button>
      </form>
    </section>

    <section class="gallery-section">
      <h2><i class="fas fa-images"></i> Gabu's Birthday Gallery</h2>
      <div class="gallery" id="gallery">
        <!-- Images will be loaded by JavaScript -->
      </div>
    </section>
  </div>

  <footer>
    <p>Made with <i class="fas fa-heart" style="color:#ff6b6b;"></i> for Gabu's 1st Birthday</p>
    <p>All audio messages will be compiled into a special birthday gift for Gabu!</p>
  </footer>
</div>
<script src = "js/gabu.js"></script>
</body>
</html>
