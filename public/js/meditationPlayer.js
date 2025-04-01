import { meditations } from './data.js';
import { formatTime, calculateProgress } from './utils.js';

export class MeditationPlayer {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadInitialMeditation();
    }

    initializeElements() {
        // Get DOM elements
        this.audioPlayer = document.getElementById('audio-player');
        this.playPauseButton = document.getElementById('play-pause-button');
        this.prevButton = document.getElementById('prev-button');
        this.nextButton = document.getElementById('next-button');
        this.progressContainer = document.getElementById('progress-container');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTimeDisplay = document.getElementById('current-time');
        this.durationTimeDisplay = document.getElementById('duration-time');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeIcon = document.getElementById('volume-icon');
        this.meditationTitle = document.getElementById('meditation-title');
        this.meditationAuthor = document.getElementById('meditation-author');
        this.backgroundImage = document.getElementById('background-image');
        this.backgroundVideo = document.getElementById('background-video');
    }

    setupEventListeners() {
        // Play/Pause button
        this.playPauseButton.addEventListener('click', () => this.togglePlayPause());

        // Progress bar
        this.progressContainer.addEventListener('click', (e) => this.seek(e));

        // Volume control
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));

        // Audio events
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.onTrackLoad());
        this.audioPlayer.addEventListener('ended', () => this.onTrackEnd());

        // Navigation buttons
        this.prevButton.addEventListener('click', () => this.playPrevious());
        this.nextButton.addEventListener('click', () => this.playNext());
    }

    loadInitialMeditation() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category') || 'sleep';
        const id = urlParams.get('id');

        if (meditations[category]) {
            this.currentCategory = category;
            this.currentMeditations = meditations[category];
            
            if (id) {
                this.currentIndex = this.currentMeditations.findIndex(m => m.id === id);
                if (this.currentIndex === -1) this.currentIndex = 0;
            } else {
                this.currentIndex = 0;
            }

            this.loadTrack(this.currentMeditations[this.currentIndex]);
        }
    }

    loadTrack(track) {
        // Update audio source
        this.audioPlayer.src = track.audio;
        
        // Update metadata
        this.meditationTitle.textContent = track.title;
        this.meditationAuthor.textContent = track.author;

        // Update background
        if (track.background.type === 'image') {
            this.backgroundImage.src = track.background.src;
            this.backgroundImage.classList.remove('hidden');
            this.backgroundVideo.classList.add('hidden');
        } else if (track.background.type === 'video') {
            this.backgroundVideo.src = track.background.src;
            this.backgroundVideo.classList.remove('hidden');
            this.backgroundImage.classList.add('hidden');
        }

        // Reset progress
        this.progressFill.style.width = '0%';
        this.currentTimeDisplay.textContent = '0:00';
    }

    togglePlayPause() {
        if (this.audioPlayer.paused) {
            this.audioPlayer.play();
            this.playPauseButton.classList.remove('paused');
            this.playPauseButton.classList.add('playing');
        } else {
            this.audioPlayer.pause();
            this.playPauseButton.classList.remove('playing');
            this.playPauseButton.classList.add('paused');
        }
    }

    updateProgress() {
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        this.currentTimeDisplay.textContent = this.formatTime(this.audioPlayer.currentTime);
        this.durationTimeDisplay.textContent = this.formatTime(this.audioPlayer.duration);
    }

    seek(event) {
        const rect = this.progressContainer.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        this.audioPlayer.currentTime = percent * this.audioPlayer.duration;
    }

    updateVolume(value) {
        const volume = value / 100;
        this.audioPlayer.volume = volume;
        
        // Update volume icon
        if (volume === 0) {
            this.volumeIcon.className = 'fas fa-volume-mute text-white opacity-70';
        } else if (volume < 0.5) {
            this.volumeIcon.className = 'fas fa-volume-down text-white opacity-70';
        } else {
            this.volumeIcon.className = 'fas fa-volume-up text-white opacity-70';
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    playNext() {
        if (this.currentIndex < this.currentMeditations.length - 1) {
            this.currentIndex++;
            this.loadTrack(this.currentMeditations[this.currentIndex]);
            this.audioPlayer.play();
        }
    }

    playPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadTrack(this.currentMeditations[this.currentIndex]);
            this.audioPlayer.play();
        }
    }

    onTrackLoad() {
        this.durationTimeDisplay.textContent = this.formatTime(this.audioPlayer.duration);
    }

    onTrackEnd() {
        this.playNext();
    }
}

// Initialize player when document loads
document.addEventListener('DOMContentLoaded', () => {
    window.meditationPlayer = new MeditationPlayer();
});