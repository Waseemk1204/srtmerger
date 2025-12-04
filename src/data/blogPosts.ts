export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  content: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'how-to-merge-two-srt-files-online',
    title: "How to Merge Two SRT Files Online (Step-by-Step Guide)",
    excerpt: "A simple tutorial for combining multiple subtitle files into one. Learn how to merge SRT files for movies, dual-language setups, and more.",
    date: "December 4, 2025",
    readTime: "3 min read",
    content: `
      <p class="mb-6">Subtitles are essential for accessibility, language learning, and enhancing the viewing experience. But what if you have two separate SRT files—for example:</p>

      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>Part 1 and Part 2 subtitles</li>
          <li>Dialogues from two different subtitle creators</li>
          <li>Subtitles in two different languages</li>
          <li>A missing segment in one file that another file has</li>
          <li>Separate CD1/CD2 subtitle files for movies</li>
      </ul>

      <p class="mb-6">In these cases, the easiest solution is to merge the SRT files into a single, clean subtitle file. This guide explains how to merge two SRT files online, quickly and without needing any technical knowledge.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">What You’ll Need</h3>
      <p class="mb-6">All you need are:</p>
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>Two SRT files</li>
          <li>An online subtitle-merging tool</li>
          <li>A browser (Chrome, Safari, Firefox, etc.)</li>
      </ul>
      <p class="mb-6">A modern online merger handles the technical work for you—timing, ordering, and combining lines.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">Step-by-Step: How to Merge Two SRT Files Online</h3>

      <h4 class="text-lg font-bold text-gray-900 mt-6 mb-3">Step 1: Prepare Your Subtitle Files</h4>
      <p class="mb-6">Make sure:</p>
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>Both files are in .srt format</li>
          <li>They contain proper timestamps</li>
          <li>They aren’t corrupted or incomplete</li>
      </ul>
      <p class="mb-6">If you’re unsure, open them in a text editor to confirm they look like this:</p>
      <pre class="bg-gray-100 p-4 rounded-lg mb-6 text-sm font-mono">1
00:00:01,000 --> 00:00:03,000
Hello there!

2
00:00:04,000 --> 00:00:06,000
Welcome back.</pre>

      <h4 class="text-lg font-bold text-gray-900 mt-6 mb-3">Step 2: Upload the SRT Files to an Online Merger</h4>
      <p class="mb-6">Most online subtitle merging tools follow the same process:</p>
      <ol class="list-decimal list-inside space-y-2 mb-6 text-gray-700">
          <li>Open the subtitle merger webpage</li>
          <li>Click Upload or Choose File</li>
          <li>Select both SRT files</li>
          <li>Confirm the upload</li>
      </ol>
      <p class="mb-6">The tool will automatically read the timestamps and prepare the merge.</p>

      <h4 class="text-lg font-bold text-gray-900 mt-6 mb-3">Step 3: Choose Your Merge Mode</h4>
      <p class="mb-6">Most tools offer two types of merging:</p>

      <p class="font-bold mb-2">1. Append Merge (Part 1 → Part 2)</p>
      <p class="mb-2">Use when:</p>
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>You have Part 1 and Part 2 of a movie</li>
          <li>CD1/CD2 subtitle files</li>
          <li>Two sequential files</li>
          <li>Subtitles follow each other chronologically</li>
      </ul>
      <p class="mb-6">This simply attaches File B after File A.</p>

      <p class="font-bold mb-2">2. Overlay Merge (Line by Line Merge)</p>
      <p class="mb-2">Use when:</p>
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>Merging two languages (e.g., Hindi + English)</li>
          <li>One file contains missing lines</li>
          <li>You want combined subtitles in parallel</li>
      </ul>
      <p class="mb-6">The tool will try to align timestamps and merge lines intelligently.</p>

      <h4 class="text-lg font-bold text-gray-900 mt-6 mb-3">Step 4: Adjust Timing Settings (Optional)</h4>
      <p class="mb-6">Some tools allow:</p>
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>Shift timestamps (if one file is off by a few seconds)</li>
          <li>Fix overlapping timestamps</li>
          <li>Remove duplicate lines</li>
          <li>Recalculate time gaps</li>
      </ul>
      <p class="mb-6">If your files are synced properly, you can skip this.</p>

      <h4 class="text-lg font-bold text-gray-900 mt-6 mb-3">Step 5: Merge and Download the Final File</h4>
      <p class="mb-6">Click Merge or Generate File.</p>
      <p class="mb-6">The tool will:</p>
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>Combine both SRT files</li>
          <li>Order subtitles by timestamp</li>
          <li>Clean duplicates</li>
          <li>Produce one final merged.srt file</li>
      </ul>
      <p class="mb-6">Download it and test it with any video player (like VLC) to ensure everything looks correct.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">✔️ Tips for a Clean and Accurate Merge</h3>

      <p class="font-bold mb-2">1. Check for Duplicate Lines</p>
      <p class="mb-6">If both files contain the same scenes, duplicates may appear. Many tools automatically remove them.</p>

      <p class="font-bold mb-2">2. Fix Overlapping Timestamps</p>
      <p class="mb-6">Overlapping subtitles occur when both files contain content for the same timeframe. These can be cleaned with the tool’s “fix overlap” feature.</p>

      <p class="font-bold mb-2">3. Sync Both Subtitle Files Before Merging</p>
      <p class="mb-6">If one subtitle file starts earlier/later than the other: Shift the timing, then merge. This prevents misalignment or messy output.</p>

      <p class="font-bold mb-2">4. Test on a Video Player</p>
      <p class="mb-6">Use VLC or MX Player to confirm: Text alignment, Timing, No missing lines.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">When Do You Need to Merge Two SRT Files?</h3>
      <p class="mb-6">Here are common situations where merging subtitles is useful:</p>
      <ol class="list-decimal list-inside space-y-2 mb-6 text-gray-700">
          <li><strong>CD1/CD2 subtitles for older movies</strong>: Many older movie subtitles are split into two files.</li>
          <li><strong>Two subtitle creators, two versions</strong>: Sometimes one version is incomplete, while the other has better accuracy.</li>
          <li><strong>Combining two languages</strong>: E.g., English + Hindi, English + Arabic, English + Japanese for language learners.</li>
          <li><strong>Recovering missing dialogue</strong>: One file might have missing sections that another file includes.</li>
          <li><strong>Splitting and recombining video parts</strong>: If a video was split and later combined, subtitles must be merged too.</li>
      </ol>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">Common Issues & How to Avoid Them</h3>

      <p class="mb-2">❌ <strong>Issue: Subtitles appear twice</strong></p>
      <p class="mb-6">Fix: Remove duplicates in the merger tool.</p>

      <p class="mb-2">❌ <strong>Issue: Subtitles appear too early or too late</strong></p>
      <p class="mb-6">Fix: Shift the entire file forward/backward by a few seconds.</p>

      <p class="mb-2">❌ <strong>Issue: Wrong ordering after merge</strong></p>
      <p class="mb-6">Fix: Ensure timestamps are clean and non-overlapping.</p>

      <p class="mb-2">❌ <strong>Issue: Characters not displaying properly (Arabic/Hindi/Korean)</strong></p>
      <p class="mb-6">Fix: Save the SRT file with UTF-8 encoding.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">Conclusion</h3>
      <p class="mb-6">Merging two SRT subtitle files online is simple and only takes a minute. Whether you’re combining parts, languages, or versions, an online subtitle merger helps you:</p>
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>Save time</li>
          <li>Fix missing lines</li>
          <li>Improve clarity</li>
          <li>Keep perfect sync</li>
          <li>Produce one clean subtitle file for your video</li>
      </ul>
      <p class="mb-6">You now have everything you need to merge SRT files quickly and accurately.</p>
    `
  }
];
