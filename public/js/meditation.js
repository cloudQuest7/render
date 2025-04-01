// meditationPlayer.js - Handles the audio player functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const shuffleButton = document.getElementById('shuffle-button');
    const repeatButton = document.getElementById('repeat-button');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationTimeDisplay = document.getElementById('duration-time');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const currentMeditationImage = document.getElementById('current-meditation-image');
    const currentMeditationTitle = document.getElementById('current-meditation-title');
    const currentMeditationAuthor = document.getElementById('current-meditation-author');
    const queueContainer = document.getElementById('queue-container');
    
    // Player state
    let isPlaying = false;
    let currentTrackIndex = -1;
    let isShuffleOn = false;
    let isRepeatOn = false;
    let queue = [];
    let originalQueue = [];
    
    // Initialize volume from slider
    audioPlayer.volume = volumeSlider.value / 100;

    // Get all meditation tracks
    const meditationItems = document.querySelectorAll('[data-track]');
    const tracks = Array.from(meditationItems).map(item => JSON.parse(item.getAttribute('data-track')));
    
    // Handle image loading errors
    document.querySelectorAll('.recently-played-image img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.opacity = '0';
            const fallbackGradient = this.closest('.recently-played-image').querySelector('.fallback-gradient');
            if (fallbackGradient) {
                fallbackGradient.style.zIndex = '15';
            }
        });
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            const placeholder = this.closest('.image-placeholder');
            if (placeholder) {
                placeholder.classList.remove('image-placeholder');
            }
        });
    });
    
    // Initialize player with the first track
    function initializePlayer() {
        if (tracks.length > 0) {
            originalQueue = [...tracks];
            queue = [...tracks];
            updateQueueDisplay();
        }
    }
    
    // Load track
    function loadTrack(trackIndex) {
        if (trackIndex >= 0 && trackIndex < queue.length) {
            const track = queue[trackIndex];
            audioPlayer.src = track.audio;
            currentMeditationTitle.textContent = track.title;
            currentMeditationAuthor.textContent = track.author || 'Meditation Guide';
            
            // Handle image loading
            currentMeditationImage.src = track.image;
            currentMeditationImage.addEventListener('error', function() {
                this.src = '/images/meditation/default.jpg';
            });
            
            // Highlight the currently playing track in the UI
            document.querySelectorAll('[data-track]').forEach((item, index) => {
                const itemData = JSON.parse(item.getAttribute('data-track'));
                if (itemData.id === track.id) {
                    item.classList.add('bg-[#282828]');
                } else {
                    item.classList.remove('bg-[#282828]');
                }
            });
            
            currentTrackIndex = trackIndex;
            audioPlayer.load();
        }
    }
    
    // Play/Pause logic
    function togglePlayPause() {
        if (currentTrackIndex === -1 && queue.length > 0) {
            currentTrackIndex = 0;
            loadTrack(currentTrackIndex);
        }
        
        if (audioPlayer.src) {
            if (isPlaying) {
                audioPlayer.pause();
                playPauseButton.classList.remove('playing');
                playPauseButton.classList.add('paused');
            } else {
                audioPlayer.play()
                    .then(() => {
                        playPauseButton.classList.add('playing');
                        playPauseButton.classList.remove('paused');
                    })
                    .catch(error => {
                        console.error('Error playing audio:', error);
                        // Handle autoplay restrictions
                        alert('Please interact with the page to enable audio playback');
                    });
            }
            isPlaying = !isPlaying;
        }
    }
    
    // Play next track
    function playNext() {
        let nextIndex = currentTrackIndex + 1;
        if (nextIndex >= queue.length) {
            if (isRepeatOn) {
                nextIndex = 0;
            } else {
                // End of queue
                return;
            }
        }
        loadTrack(nextIndex);
        if (isPlaying) {
            audioPlayer.play()
                .catch(error => console.error('Error playing next track:', error));
        }
    }
    
    // Play previous track
    function playPrevious() {
        // If we're more than 3 seconds into a track, restart it instead of going to previous
        if (audioPlayer.currentTime > 3) {
            audioPlayer.currentTime = 0;
            return;
        }
        
        let prevIndex = currentTrackIndex - 1;
        if (prevIndex < 0) {
            if (isRepeatOn) {
                prevIndex = queue.length - 1;
            } else {
                // Beginning of queue
                return;
            }
        }
        loadTrack(prevIndex);
        if (isPlaying) {
            audioPlayer.play()
                .catch(error => console.error('Error playing previous track:', error));
        }
    }
    
    // Toggle shuffle
    function toggleShuffle() {
        isShuffleOn = !isShuffleOn;
        shuffleButton.classList.toggle('text-[#1DB954]', isShuffleOn);
        
        if (isShuffleOn) {
            // Save current track
            const currentTrack = currentTrackIndex >= 0 ? queue[currentTrackIndex] : null;
            
            // Shuffle queue
            queue = [...originalQueue];
            for (let i = queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [queue[i], queue[j]] = [queue[j], queue[i]];
            }
            
            // If we were playing something, put it first
            if (currentTrack) {
                const newIndex = queue.findIndex(track => track.id === currentTrack.id);
                if (newIndex !== -1) {
                    [queue[0], queue[newIndex]] = [queue[newIndex], queue[0]];
                    currentTrackIndex = 0;
                }
            }
        } else {
            // Restore original queue order
            const currentTrack = currentTrackIndex >= 0 ? queue[currentTrackIndex] : null;
            queue = [...originalQueue];
            
            // Find current track in original queue
            if (currentTrack) {
                currentTrackIndex = queue.findIndex(track => track.id === currentTrack.id);
            }
        }
        
        updateQueueDisplay();
    }
    
    // Toggle repeat
    function toggleRepeat() {
        isRepeatOn = !isRepeatOn;
        repeatButton.classList.toggle('text-[#1DB954]', isRepeatOn);
    }
    
    // Update progress bar
    function updateProgress() {
        if (audioPlayer.duration) {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressFill.style.width = `${progressPercent}%`;
            
            // Update time displays
            currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
            durationTimeDisplay.textContent = formatTime(audioPlayer.duration);
        }
    }
    
    // Set progress when user clicks on progress bar
    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        
        if (duration) {
            audioPlayer.currentTime = (clickX / width) * duration;
        }
    }
    
    // Format time in MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // Update volume
    function updateVolume() {
        audioPlayer.volume = this.value / 100;
        
        // Update volume icon
        if (this.value == 0) {
            volumeIcon.className = 'fas fa-volume-mute text-gray-400';
        } else if (this.value < 50) {
            volumeIcon.className = 'fas fa-volume-down text-gray-400';
        } else {
            volumeIcon.className = 'fas fa-volume-up text-gray-400';
        }
    }
    
    // Update queue display
    function updateQueueDisplay() {
        queueContainer.innerHTML = '';
        
        // Display the next 3 tracks in queue
        const startIndex = currentTrackIndex + 1;
        for (let i = startIndex; i < startIndex + 3 && i < queue.length; i++) {
            const track = queue[i];
            
            const queueItem = document.createElement('div');
            queueItem.className = 'flex items-center text-sm text-gray-400 p-2 hover:bg-[#282828] rounded';
            queueItem.innerHTML = `
                <div class="w-10 h-10 rounded mr-3 flex-shrink-0" style="background: linear-gradient(135deg, ${track.gradient[0]}, ${track.gradient[1]})">
                    <img src="${track.image}" alt="${track.title}" class="w-full h-full object-cover rounded" onerror="this.style.display='none'">
                </div>
                <div class="truncate">
                    <p class="text-white truncate">${track.title}</p>
                    <p class="truncate">${track.duration}</p>
                </div>
            `;
            
            queueItem.addEventListener('click', () => {
                loadTrack(i);
                if (isPlaying) {
                    audioPlayer.play()
                        .catch(error => console.error('Error playing selected track:', error));
                } else {
                    togglePlayPause();
                }
            });
            
            queueContainer.appendChild(queueItem);
        }
        
        if (startIndex >= queue.length) {
            const emptyQueueMsg = document.createElement('div');
            emptyQueueMsg.className = 'text-sm text-gray-500';
            emptyQueueMsg.textContent = 'End of queue';
            queueContainer.appendChild(emptyQueueMsg);
        }
    }
    
    // Click on meditation item to play
    meditationItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            const trackData = JSON.parse(this.getAttribute('data-track'));
            const trackIndex = queue.findIndex(track => track.id === trackData.id);
            
            if (trackIndex !== -1) {
                if (currentTrackIndex === trackIndex && isPlaying) {
                    togglePlayPause(); // Pause if already playing this track
                } else {
                    loadTrack(trackIndex);
                    isPlaying = false; // Set to false so togglePlayPause will play
                    togglePlayPause();
                }
            }
        });
    });
    
    // Handle audio events
    audioPlayer.addEventListener('ended', playNext);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', () => {
        durationTimeDisplay.textContent = formatTime(audioPlayer.duration);
    });
    
    // UI Controls
    playPauseButton.addEventListener('click', togglePlayPause);
    prevButton.addEventListener('click', playPrevious);
    nextButton.addEventListener('click', playNext);
    shuffleButton.addEventListener('click', toggleShuffle);
    repeatButton.addEventListener('click', toggleRepeat);
    progressContainer.addEventListener('click', setProgress);
    volumeSlider.addEventListener('input', updateVolume);
    
    // Initialize on load
    initializePlayer();
    
    // Export functions for other scripts to use
    window.meditationPlayer = {
        play: togglePlayPause,
        next: playNext,
        previous: playPrevious,
        loadTrack: loadTrack
    };
});

// Add this function to your meditation.js
function updateMeditationImage(imageUrl) {
    const imageElement = document.getElementById('current-meditation-image');
    const container = document.getElementById('current-meditation-image-container');
    
    // Remove error state if it exists
    container.classList.remove('image-error');
    
    // Set new image source
    imageElement.src = imageUrl || '/images/meditation/default-meditation.jpg';
    
    // Add error handling
    imageElement.onerror = function() {
        this.onerror = null;
        this.src = '/images/meditation/default-meditation.jpg';
        container.classList.add('image-error');
    };
}