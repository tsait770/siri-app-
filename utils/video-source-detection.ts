export interface VideoSourceInfo {
  platform: string;
  type: 'supported' | 'extended' | 'unsupported';
  description: string;
  videoId?: string;
}

export interface VideoSourceDetectionResult {
  isSupported: boolean;
  sourceInfo: VideoSourceInfo;
}

export function detectVideoSource(url: string): VideoSourceDetectionResult {
  if (!url || typeof url !== 'string') {
    return {
      isSupported: false,
      sourceInfo: {
        platform: 'Unknown',
        type: 'unsupported',
        description: 'Invalid URL provided'
      }
    };
  }

  const supportedRegex = [
    // Direct video files (comprehensive formats)
    { regex: /.*\.(mp4|webm|ogg|ogv|mov|avi|mkv|flv|wmv|m4v)$/i, platform: 'Direct Video' },
    // MP4 files with query parameters
    { regex: /.*\.mp4(\?.*)?$/i, platform: 'Direct Video' },
    // Common video MIME types in URLs
    { regex: /.*\/(video|media)\/.*\.(mp4|webm|ogg|ogv|mov|avi|mkv|flv|wmv|m4v)/i, platform: 'Direct Video' },
    
    // Streaming formats
    { regex: /.*\.m3u8$/i, platform: 'HLS Stream' },
    { regex: /.*\.mpd$/i, platform: 'DASH Stream' },
    { regex: /^rtmp:\/\/.*/, platform: 'RTMP Stream' },
    
    // YouTube formats (comprehensive patterns)
    { regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([\w-]+)(?:[&?][^\s]*)?/i, platform: 'YouTube' },
    { regex: /youtube\.com\/watch\?.*[&?]v=([\w-]+)/i, platform: 'YouTube' },
    { regex: /youtu\.be\/([\w-]+)(?:\?[^\s]*)?/i, platform: 'YouTube' },
    { regex: /youtube\.com\/embed\/([\w-]+)(?:\?[^\s]*)?/i, platform: 'YouTube' },
    { regex: /youtube\.com\/v\/([\w-]+)(?:\?[^\s]*)?/i, platform: 'YouTube' },
    
    // Video platforms
    { regex: /vimeo\.com\/\d+/, platform: 'Vimeo' },
    { regex: /vimeo\.com\/video\/\d+/, platform: 'Vimeo' },
    { regex: /twitch\.tv\/videos\/\d+/, platform: 'Twitch' },
    { regex: /twitch\.tv\/\w+/, platform: 'Twitch' },
    { regex: /facebook\.com\/watch\/\?v=\d+/, platform: 'Facebook' },
    { regex: /fb\.watch\/[\w-]+/, platform: 'Facebook' },
    
    // Cloud storage
    { regex: /drive\.google\.com\/file\/d\/[\w-]+\/view/, platform: 'Google Drive' },
    { regex: /drive\.google\.com\/open\?id=[\w-]+/, platform: 'Google Drive' },
    { regex: /dropbox\.com\/s\/[\w-]+\/.*\.(mp4|webm|ogg|ogv)/, platform: 'Dropbox' },
    { regex: /dropbox\.com\/scl\/fi\/[\w-]+\/.*\.(mp4|webm|ogg|ogv)/, platform: 'Dropbox' },
    
    // CDN and hosting services
    { regex: /.*\.cloudfront\.net\/.*\.(mp4|webm|ogg|ogv)/, platform: 'CloudFront CDN' },
    { regex: /.*\.amazonaws\.com\/.*\.(mp4|webm|ogg|ogv)/, platform: 'AWS S3' },
    { regex: /.*\.googleapis\.com\/.*\.(mp4|webm|ogg|ogv)/, platform: 'Google Cloud' },
    { regex: /commondatastorage\.googleapis\.com\/.*\.(mp4|webm|ogg|ogv)/, platform: 'Google Storage' },
    { regex: /sample-videos\.com\/.*\.(mp4|webm|ogg|ogv)/, platform: 'Sample Videos' },
    { regex: /learningcontainer\.com\/.*\.(mp4|webm|ogg|ogv)/, platform: 'Learning Container' }
  ];

  const extendedRegex = [
    // Adult content platforms - comprehensive list
    { regex: /pornhub\.com\/view_video\.php\?viewkey=[\w-]+/, platform: 'Pornhub' },
    { regex: /pornhub\.com\/embed\/[\w-]+/, platform: 'Pornhub' },
    { regex: /xvideos\.com\/video\d+\//, platform: 'XVideos' },
    { regex: /xvideos\.com\/embedframe\/\d+/, platform: 'XVideos' },
    { regex: /xhamster\.com\/videos\/[\w-]+/, platform: 'XHamster' },
    { regex: /xhamster\.com\/embed\/[\w-]+/, platform: 'XHamster' },
    { regex: /redtube\.com\/\d+/, platform: 'RedTube' },
    { regex: /youporn\.com\/watch\/\d+/, platform: 'YouPorn' },
    { regex: /tube8\.com\/[\w-]+\/[\w-]+\/\d+/, platform: 'Tube8' },
    { regex: /spankbang\.com\/[\w-]+\/video\/[\w-]+/, platform: 'SpankBang' },
    { regex: /eporner\.com\/video-[\w-]+\/[\w-]+/, platform: 'Eporner' },
    { regex: /txxx\.com\/videos\/\d+/, platform: 'TXXX' },
    { regex: /hqporner\.com\/hdporn\/[\w-]+/, platform: 'HQPorner' },
    { regex: /xnxx\.com\/video-[\w-]+/, platform: 'XNXX' },
    { regex: /beeg\.com\/\d+/, platform: 'Beeg' },
    { regex: /drtuber\.com\/video\/\d+/, platform: 'DrTuber' },
    { regex: /tnaflix\.com\/[\w-]+\/video\d+/, platform: 'TNAFlix' },
    { regex: /empflix\.com\/videos\/[\w-]+/, platform: 'EmpFlix' },
    { regex: /slutload\.com\/video\/[\w-]+/, platform: 'SlutLoad' },
    { regex: /motherless\.com\/[A-Z0-9]+/, platform: 'Motherless' },
    { regex: /heavy-r\.com\/video\/\d+/, platform: 'Heavy-R' },
    { regex: /upornia\.com\/videos\/\d+/, platform: 'Upornia' },
    { regex: /gotporn\.com\/video\/\d+/, platform: 'GotPorn' },
    { regex: /sunporno\.com\/videos\/\d+/, platform: 'SunPorno' },
    { regex: /analdin\.com\/videos\/\d+/, platform: 'AnalDin' },
    { regex: /nuvid\.com\/video\/\d+/, platform: 'NuVid' },
    { regex: /vjav\.com\/videos\/\d+/, platform: 'VJAV' },
    { regex: /javhd\.com\/videos\/\d+/, platform: 'JAVHD' },
    { regex: /javmost\.com\/[\w-]+/, platform: 'JAVMost' },
    
    // Social media platforms
    { regex: /twitter\.com\/.*\/status\/\d+/, platform: 'Twitter' },
    { regex: /x\.com\/.*\/status\/\d+/, platform: 'X (Twitter)' },
    { regex: /instagram\.com\/(reel|p|tv)\/[\w-]+/, platform: 'Instagram' },
    { regex: /instagram\.com\/stories\/[\w.-]+\/\d+/, platform: 'Instagram Stories' },
    { regex: /tiktok\.com\/@[\w.-]+\/video\/\d+/, platform: 'TikTok' },
    { regex: /reddit\.com\/r\/\w+\/comments\/[\w-]+/, platform: 'Reddit' },
    { regex: /v\.redd\.it\/[\w-]+/, platform: 'Reddit Video' },
    { regex: /gfycat\.com\/[\w-]+/, platform: 'Gfycat' },
    { regex: /redgifs\.com\/watch\/[\w-]+/, platform: 'RedGIFs' },
    
    // International platforms
    { regex: /bilibili\.com\/video\/[A-Za-z0-9]+/, platform: 'Bilibili' },
    { regex: /youku\.com\/v_show\/id_[\w=]+/, platform: 'Youku' },
    { regex: /tudou\.com\/programs\/view\/[\w-]+/, platform: 'Tudou' },
    { regex: /iqiyi\.com\/v_[\w-]+/, platform: 'iQiyi' },
    { regex: /qq\.com\/x\/cover\/[\w-]+/, platform: 'Tencent Video' },
    { regex: /weibo\.com\/tv\/show\/\d+/, platform: 'Weibo Video' },
    { regex: /douyin\.com\/video\/\d+/, platform: 'Douyin' },
    
    // Live streaming platforms
    { regex: /twitch\.tv\/\w+\/clip\/[\w-]+/, platform: 'Twitch Clip' },
    { regex: /youtube\.com\/live\/[\w-]+/, platform: 'YouTube Live' },
    { regex: /kick\.com\/[\w-]+/, platform: 'Kick' },
    { regex: /chaturbate\.com\/[\w-]+/, platform: 'Chaturbate' },
    { regex: /cam4\.com\/[\w-]+/, platform: 'Cam4' },
    
    // File hosting services
    { regex: /mediafire\.com\/file\/[\w-]+/, platform: 'MediaFire' },
    { regex: /mega\.nz\/(file|embed)\/[\w-]+/, platform: 'MEGA' },
    { regex: /4shared\.com\/video\/[\w-]+/, platform: '4shared' },
    { regex: /sendvid\.com\/[\w-]+/, platform: 'SendVid' },
    { regex: /streamable\.com\/[\w-]+/, platform: 'Streamable' },
    { regex: /vidme\.com\/[\w-]+/, platform: 'Vid.me' }
  ];

  const unsupportedRegex = [
    // DRM-protected streaming services
    { regex: /netflix\.com/, platform: 'Netflix' },
    { regex: /disneyplus\.com/, platform: 'Disney+' },
    { regex: /hbomax\.com/, platform: 'HBO Max' },
    { regex: /hbo\.com/, platform: 'HBO' },
    { regex: /primevideo\.com/, platform: 'Amazon Prime Video' },
    { regex: /amazon\.com\/gp\/video/, platform: 'Amazon Prime Video' },
    { regex: /apple\.com\/tv/, platform: 'Apple TV+' },
    { regex: /tv\.apple\.com/, platform: 'Apple TV+' },
    { regex: /hulu\.com/, platform: 'Hulu' },
    { regex: /peacocktv\.com/, platform: 'Peacock' },
    { regex: /paramountplus\.com/, platform: 'Paramount+' },
    { regex: /showtime\.com/, platform: 'Showtime' },
    { regex: /starz\.com/, platform: 'Starz' },
    { regex: /crunchyroll\.com/, platform: 'Crunchyroll' },
    { regex: /funimation\.com/, platform: 'Funimation' },
    
    // Regional streaming services
    { regex: /bbc\.co\.uk\/iplayer/, platform: 'BBC iPlayer' },
    { regex: /itv\.com\/hub/, platform: 'ITV Hub' },
    { regex: /channel4\.com\/programmes/, platform: 'All 4' },
    { regex: /my5\.tv/, platform: 'My5' },
    { regex: /cbc\.ca\/player/, platform: 'CBC Gem' },
    { regex: /9now\.com\.au/, platform: '9Now' },
    { regex: /tenplay\.com\.au/, platform: '10 Play' },
    { regex: /sbs\.com\.au\/ondemand/, platform: 'SBS On Demand' },
    
    // Music streaming (video content)
    { regex: /spotify\.com/, platform: 'Spotify' },
    { regex: /music\.apple\.com/, platform: 'Apple Music' },
    { regex: /tidal\.com/, platform: 'Tidal' },
    
    // Educational platforms with DRM
    { regex: /coursera\.org/, platform: 'Coursera' },
    { regex: /udemy\.com/, platform: 'Udemy' },
    { regex: /linkedin\.com\/learning/, platform: 'LinkedIn Learning' },
    { regex: /pluralsight\.com/, platform: 'Pluralsight' },
    
    // Live TV services
    { regex: /sling\.com/, platform: 'Sling TV' },
    { regex: /youtubetv\.com/, platform: 'YouTube TV' },
    { regex: /fubo\.tv/, platform: 'fuboTV' }
  ];

  // Check supported sources
  for (const { regex, platform } of supportedRegex) {
    if (regex.test(url)) {
      let videoId: string | undefined;
      
      // Extract video ID for specific platforms
      if (platform === 'YouTube') {
        videoId = getYouTubeVideoId(url) || undefined;
      } else if (platform === 'Vimeo') {
        videoId = getVimeoVideoId(url) || undefined;
      }
      
      return {
        isSupported: true,
        sourceInfo: {
          platform,
          type: 'supported',
          description: `Supported ${platform} video source - Ready to play`,
          videoId
        }
      };
    }
  }

  // Check extended sources
  for (const { regex, platform } of extendedRegex) {
    if (regex.test(url)) {
      return {
        isSupported: true,
        sourceInfo: {
          platform,
          type: 'extended',
          description: `Extended ${platform} support - May require additional processing or have limitations`
        }
      };
    }
  }

  // Check unsupported sources
  for (const { regex, platform } of unsupportedRegex) {
    if (regex.test(url)) {
      return {
        isSupported: false,
        sourceInfo: {
          platform,
          type: 'unsupported',
          description: `${platform} is not supported due to DRM/copyright restrictions`
        }
      };
    }
  }

  // Unknown source
  return {
    isSupported: false,
    sourceInfo: {
      platform: 'Unknown',
      type: 'unsupported',
      description: 'Unknown video source or format not supported'
    }
  };
}

export function convertYouTubeToEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Extract video ID from various YouTube URL formats with comprehensive patterns
  let videoId: string | null = null;

  // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID (with optional parameters)
  const standardMatch = url.match(/(?:youtube\.com\/watch\?.*[&?]v=|youtube\.com\/watch\?v=)([\w-]+)/i);
  if (standardMatch) {
    videoId = standardMatch[1];
  }

  // Short YouTube URL: https://youtu.be/VIDEO_ID (with optional parameters)
  const shortMatch = url.match(/youtu\.be\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (shortMatch) {
    videoId = shortMatch[1];
  }

  // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID (with optional parameters)
  const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (embedMatch) {
    videoId = embedMatch[1];
  }

  // YouTube v URL: https://www.youtube.com/v/VIDEO_ID (with optional parameters)
  const vMatch = url.match(/youtube\.com\/v\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (vMatch) {
    videoId = vMatch[1];
  }

  if (videoId) {
    // Clean the video ID (remove any additional parameters)
    videoId = videoId.split('&')[0].split('?')[0];
    // Return the original URL for now as embed URLs may not work with expo-video
    // We'll handle YouTube differently in the video player
    return url;
  }

  return null;
}

export function getYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Extract video ID from various YouTube URL formats with comprehensive patterns
  let videoId: string | null = null;

  // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID (with optional parameters)
  const standardMatch = url.match(/(?:youtube\.com\/watch\?.*[&?]v=|youtube\.com\/watch\?v=)([\w-]+)/i);
  if (standardMatch) {
    videoId = standardMatch[1];
  }

  // Short YouTube URL: https://youtu.be/VIDEO_ID (with optional parameters)
  const shortMatch = url.match(/youtu\.be\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (shortMatch) {
    videoId = shortMatch[1];
  }

  // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID (with optional parameters)
  const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (embedMatch) {
    videoId = embedMatch[1];
  }

  // YouTube v URL: https://www.youtube.com/v/VIDEO_ID (with optional parameters)
  const vMatch = url.match(/youtube\.com\/v\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (vMatch) {
    videoId = vMatch[1];
  }

  if (videoId) {
    // Clean the video ID (remove any additional parameters)
    videoId = videoId.split('&')[0].split('?')[0];
    return videoId;
  }

  return null;
}

export function convertToPlayableUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  const detection = detectVideoSource(url);
  console.log('Converting URL for platform:', detection.sourceInfo.platform);
  
  // For YouTube, we cannot convert to playable URL due to CORS
  if (detection.sourceInfo.platform === 'YouTube') {
    console.warn('YouTube videos cannot be converted to playable URLs due to CORS restrictions');
    return url; // Return original URL (will fail, but handled in loadVideo)
  }
  
  // For Google Drive, convert to direct download link
  if (detection.sourceInfo.platform === 'Google Drive') {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log('Converted Google Drive URL:', directUrl);
      return directUrl;
    }
  }
  
  // For Dropbox, convert to direct link
  if (detection.sourceInfo.platform === 'Dropbox') {
    if (url.includes('dropbox.com') && !url.includes('dl=1')) {
      const separator = url.includes('?') ? '&' : '?';
      const directUrl = `${url}${separator}dl=1`;
      console.log('Converted Dropbox URL:', directUrl);
      return directUrl;
    }
  }
  
  // For direct video files, ensure proper URL format
  if (isDirectVideoFile(url)) {
    console.log('Direct video file - no conversion needed');
    return url;
  }
  
  // For streaming formats, return as-is
  if (isStreamingFormat(url)) {
    console.log('Streaming format - no conversion needed');
    return url;
  }
  
  // For other platforms, return the original URL
  console.log('No conversion applied for platform:', detection.sourceInfo.platform);
  return url;
}

export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    
    // Basic URL validation
    if (!urlObj.protocol.startsWith('http')) {
      return false;
    }
    
    const detection = detectVideoSource(url);
    
    // YouTube is technically valid but not playable
    if (detection.sourceInfo.platform === 'YouTube') {
      return false; // Not playable due to CORS
    }
    
    return detection.isSupported;
  } catch {
    return false;
  }
}

export function getVideoSourceDescription(url: string): string {
  const detection = detectVideoSource(url);
  return detection.sourceInfo.description;
}

export function getVideoSourcePlatform(url: string): string {
  const detection = detectVideoSource(url);
  return detection.sourceInfo.platform;
}

export function getVideoFileExtension(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // First try to match file extension at the end of URL (before query params)
  const match = url.match(/\.([a-zA-Z0-9]+)(?:[?#].*)?$/);
  if (match) {
    return match[1].toLowerCase();
  }
  
  // Try to match file extension in the path (for complex URLs)
  const pathMatch = url.match(/\/[^/]*\.([a-zA-Z0-9]+)(?:[?#/].*)?/);
  if (pathMatch) {
    return pathMatch[1].toLowerCase();
  }
  
  // Check if URL contains video format indicators
  if (/\b(mp4|webm|ogg|ogv|mov|avi|mkv|flv|wmv|m4v)\b/i.test(url)) {
    const formatMatch = url.match(/\b(mp4|webm|ogg|ogv|mov|avi|mkv|flv|wmv|m4v)\b/i);
    return formatMatch ? formatMatch[1].toLowerCase() : null;
  }
  
  return null;
}

export function isDirectVideoFile(url: string): boolean {
  const extension = getVideoFileExtension(url);
  const videoExtensions = ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'];
  return extension ? videoExtensions.includes(extension) : false;
}

export function isStreamingFormat(url: string): boolean {
  const extension = getVideoFileExtension(url);
  const streamingExtensions = ['m3u8', 'mpd'];
  return extension ? streamingExtensions.includes(extension) : url.startsWith('rtmp://');
}

export function requiresSpecialHandling(url: string): boolean {
  const detection = detectVideoSource(url);
  const specialPlatforms = ['YouTube', 'Vimeo', 'Twitch', 'Facebook', 'Instagram', 'TikTok'];
  return specialPlatforms.includes(detection.sourceInfo.platform);
}

export function getVimeoVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Extract video ID from various Vimeo URL formats
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(?:.*\/)?(\d+)/);
  if (vimeoMatch) {
    return vimeoMatch[1];
  }

  return null;
}

export function getOptimalVideoQuality(url: string): string {
  const detection = detectVideoSource(url);
  
  // For direct video files, suggest based on common patterns
  if (detection.sourceInfo.platform === 'Direct Video') {
    if (url.includes('4k') || url.includes('2160p')) return '4K (2160p)';
    if (url.includes('1440p') || url.includes('2k')) return '2K (1440p)';
    if (url.includes('1080p') || url.includes('fhd')) return 'Full HD (1080p)';
    if (url.includes('720p') || url.includes('hd')) return 'HD (720p)';
    if (url.includes('480p')) return 'SD (480p)';
    if (url.includes('360p')) return 'Low (360p)';
  }
  
  return 'Auto';
}