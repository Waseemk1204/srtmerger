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
        id: 'the-30-minute-limit',
        title: "The 30-Minute Limit: Why I Built This Tool",
        excerpt: "Long files have always been a headache in subtitling. Here's how a personal struggle with free-tier limitations led to building SRT Merger.",
        date: "November 27, 2024",
        readTime: "3 min read",
        content: `
      <p class="mb-6">If you’ve ever done professional subtitling, you know the specific kind of headache I’m talking about.</p>

      <p class="mb-6">I use TurboScribe. It’s fantastic. But like many of us starting out or working on a budget, I was on the free tier. That meant a hard limit: <strong>30 minutes per file</strong>.</p>

      <p class="mb-6">Great for short clips. A nightmare for anything else.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">The Manual Nightmare</h3>

      <p class="mb-6">So, I had a workflow. A bad one. I’d take a one-hour interview, split the video file in half, and transcribe both parts separately. Now I had two SRT files. One started at <code>00:00:00</code>. The other <em>also</em> started at <code>00:00:00</code>.</p>

      <p class="mb-6">Merging them wasn't just copy-paste. You have to shift every single timestamp in the second file by exactly the duration of the first video. Doing this manually is... well, it’s not feasible. I tried. I spent hours cutting, pasting, listening, adjusting. It was tedious and prone to error.</p>

      <p class="mb-6">I looked for tools. But their UI stood for Unfriendly Interface. No offence, but it is what it is.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">The Local Solution</h3>

      <p class="mb-6">I’m a developer. I realized I was wasting time doing something a computer could do in milliseconds.</p>

      <p class="mb-6">So I built a local script. Simple arithmetic logic. Take File A, find its end time, add that to every timestamp in File B. Merge.</p>

      <p class="mb-6">It worked.</p>

      <p class="mb-6">Then I had a 90-minute video. So I merged Part 1 and Part 2. Then I took that result and merged it with Part 3. It was clunky, but it saved me hours.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">Refining the Model</h3>

      <p class="mb-6">I realized this wasn't just my problem. If I was struggling with this, others were too. And I didn't want to just keep this as a messy script on my laptop. I wanted to refine it. Make it handle N files. Make it look good.</p>

      <p class="mb-6">That’s what <strong>SRT Merger</strong> is. It’s the tool I wished I had. No ads. No sign-ups. A simple freemium that wouldn’t need pro unless you are "that guy". Just a clean, private utility to get the job done. You're not doing more than two files a day anyway. I mean, transcription tools are not perfect. You have to still work on the file to make changes according to the guidelines of the creator you're working with, or your own guidelines if you are doing it for yourself. Then uploading and adjusting is another task, unless you have a big team of people just in the subtitling department.</p>

      <p class="mb-6">I’m testing my luck here, especially with the subscriptions. Honestly, I don't even know how much to charge ☠️, I just asked ChatGPT and said, "Naah, that's too much". But mostly, I’m testing my skill. Can I build something that solves a real problem, simply and beautifully?</p>

      <p class="mb-6">And also get paid for it 😏</p>

      <p class="mb-6">Anyway, I hope it saves you the headache it saved me.</p>
    `
    },
    {
        id: 'how-to-merge-srt-files-online',
        title: "How to Merge SRT Files Online for Free (No Sign-up)",
        excerpt: "A step-by-step guide to combining multiple subtitle files into one seamless timeline using SRT Merger. Perfect for long videos and split transcriptions.",
        date: "November 28, 2024",
        readTime: "4 min read",
        content: `
      <p class="mb-6">Merging SRT files is a common need for video editors, translators, and content creators. Whether you've split a long recording into chunks for transcription or you're combining subtitles from different sources, having a reliable <strong>SRT merger</strong> is essential.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">Why Merge SRT Files?</h3>
      <p class="mb-6">Most automated transcription services have limits. For example, free tiers often cap files at 30 minutes. This forces you to split your video, transcribe each part, and then face the challenge of stitching the subtitles back together.</p>
      
      <p class="mb-6">Simply pasting the text doesn't work. The timestamps in the second file will start from <code>00:00:00</code>, overlapping with the first file. You need to <strong>shift the timestamps</strong> of the second file by the exact duration of the first.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">The Easy Way: Using SRT Merger</h3>
      <p class="mb-6">We built SRT Merger to solve this exact problem. Here is how to use it:</p>

      <ol class="list-decimal list-inside space-y-4 mb-8 text-gray-700">
        <li><strong>Upload your files</strong>: Drag and drop your .srt files into the upload area. You can upload as many as you need.</li>
        <li><strong>Arrange the order</strong>: Drag the files to ensure they are in the correct sequence (Part 1, Part 2, etc.).</li>
        <li><strong>Check the timeline</strong>: Our tool automatically calculates the offset based on the previous file's duration. You can tweak this if needed.</li>
        <li><strong>Preview and Merge</strong>: See the result instantly and click "Merge & Download".</li>
      </ol>

      <p class="mb-6">No complex software, no command line, and best of all—no sign-up required. Just a fast, secure, and free online tool to <strong>combine subtitles</strong> in seconds.</p>
    `
    },
    {
        id: 'srt-vs-vtt-subtitle-formats',
        title: "SRT vs VTT: Which Subtitle Format Should You Use?",
        excerpt: "Understanding the differences between SubRip (SRT) and WebVTT (VTT) formats, and when to use each for your video projects.",
        date: "November 29, 2024",
        readTime: "5 min read",
        content: `
      <p class="mb-6">In the world of web video, two subtitle formats reign supreme: <strong>SRT</strong> and <strong>VTT</strong>. While they look similar, they serve different purposes. If you're looking to <strong>merge subtitles</strong> or upload captions to YouTube, knowing the difference is key.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">What is SRT?</h3>
      <p class="mb-6"><strong>SRT (SubRip Subtitle)</strong> is the most widely supported subtitle format. It's incredibly simple: just a sequence number, a timestamp range, and the text.</p>
      <pre class="bg-gray-100 p-4 rounded-lg mb-6 text-sm font-mono">1
00:00:01,000 --> 00:00:04,000
Hello, this is an SRT file.</pre>
      <p class="mb-6"><strong>Pros:</strong> Supported by almost every video player (VLC, YouTube, Facebook, etc.). Simple to edit manually.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">What is VTT?</h3>
      <p class="mb-6"><strong>VTT (WebVTT)</strong> is the standard for HTML5 video. It adds more features like styling, positioning, and metadata.</p>
      <pre class="bg-gray-100 p-4 rounded-lg mb-6 text-sm font-mono">WEBVTT

00:00:01.000 --> 00:00:04.000 align:start line:0%
Hello, this is a VTT file.</pre>
      <p class="mb-6"><strong>Pros:</strong> Advanced styling options. Native to HTML5 web players.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">Which One to Choose?</h3>
      <p class="mb-6">For most users, <strong>SRT is the safest bet</strong>. It works everywhere. If you are building a custom web player and need fancy positioning, go with VTT.</p>
      
      <p class="mb-6">The good news? <strong>SRT Merger</strong> supports both. You can upload SRT or VTT files, and we'll handle the merging logic seamlessly.</p>
    `
    },
    {
        id: 'guide-to-subtitle-time-shifting',
        title: "The Ultimate Guide to Subtitle Time Shifting",
        excerpt: "Out of sync subtitles? Learn how time shifting works and how to fix synchronization issues when merging multiple files.",
        date: "November 30, 2024",
        readTime: "4 min read",
        content: `
      <p class="mb-6">Nothing ruins a video faster than out-of-sync subtitles. You hear a joke, and the text appears three seconds later. This usually happens when you <strong>merge subtitle files</strong> without adjusting the timestamps.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">How Time Shifting Works</h3>
      <p class="mb-6">Time shifting is the process of adding or subtracting a specific amount of time from every timestamp in a file. Mathematically, it's simple:</p>
      <p class="mb-6 font-mono bg-gray-100 p-2 rounded inline-block">New_Start_Time = Original_Start_Time + Offset</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">The Challenge with Merging</h3>
      <p class="mb-6">When you have two video clips, Part 1 (10 minutes) and Part 2 (10 minutes), the subtitles for Part 2 usually start at <code>00:00:00</code>. But in the merged video, Part 2 actually starts at <code>00:10:00</code>.</p>
      
      <p class="mb-6">To fix this, you need to <strong>shift</strong> every timestamp in Part 2 by exactly 10 minutes (600,000 milliseconds).</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">Automating the Process</h3>
      <p class="mb-6">Doing this manually for hundreds of lines is impossible. That's why we built <strong>SRT Merger</strong>. Our tool automatically detects the duration of your first file and applies the correct time shift to the next one.</p>
      
      <p class="mb-6">You can even customize the offset if you have a gap between videos. It's the smartest way to <strong>sync subtitles</strong> without the math headache.</p>
    `
    },
    {
        id: 'privacy-matters-online-tools',
        title: "Why Privacy Matters in Online Tools",
        excerpt: "Your data should stay yours. Why client-side processing is the future of secure online utilities like SRT Merger.",
        date: "December 1, 2024",
        readTime: "3 min read",
        content: `
      <p class="mb-6">In an age where "free" often means "we sell your data," finding secure online tools is hard. When you upload a file to a server to be processed, you are trusting that server with your content.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">Server-Side vs. Client-Side</h3>
      <p class="mb-6">Most <strong>online SRT mergers</strong> work by uploading your files to their cloud, processing them, and sending them back. This uses bandwidth and exposes your data.</p>
      
      <p class="mb-6"><strong>Client-side tools</strong>, like SRT Merger, run entirely in your browser. Your files never leave your device. The "upload" is just moving the file from your hard drive to your browser's memory.</p>

      <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4 font-mono">The Benefits of Client-Side Processing</h3>
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
        <li><strong>Security</strong>: Zero risk of data leaks. Perfect for confidential interviews or unreleased content.</li>
        <li><strong>Speed</strong>: No upload or download times. Processing happens instantly.</li>
        <li><strong>Reliability</strong>: Works even with a spotty internet connection once the page is loaded.</li>
      </ul>

      <p class="mb-6">We believe privacy isn't a premium feature. That's why SRT Merger is built to be 100% private by default. Merge your files with peace of mind.</p>
    `
    }
];
