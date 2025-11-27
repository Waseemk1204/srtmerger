import React, { useState, useMemo, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { DownloadIcon, SparklesIcon } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { UploadArea } from './components/UploadArea';
import { FileList } from './components/FileList';
import { Footer } from './components/Footer';
import { TimelineAlignmentCard, SecondaryFile, ComputedOffset } from './components/TimelineAlignmentCard';
import { MergePreview } from './components/MergePreview';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { HowItWorks } from './components/HowItWorks';
import { Blog } from './components/Blog';
import { BlogPost } from './components/BlogPost';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { SavedFilesSection } from './components/SavedFilesSection';
import { useAuth } from './contexts/AuthContext';
import { blogPosts } from './data/blogPosts';
import { TranscriptFile } from './types';
import { mergeSrtFiles, MergeResult } from './utils/srt-merge';
import { parseTimestampToMs, formatMsToTimestamp } from './utils/timestampUtils';
import { permissiveParseSrt } from './utils/srt-merge';
import { shiftTimestampLine } from './utils/timestamp-arith';

interface FileWithContent extends TranscriptFile {
  fileContent: string;
}

type View = 'home' | 'privacy' | 'how-it-works' | 'blog' | 'blog-post' | 'login' | 'signup' | 'dashboard';

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<FileWithContent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [computedOffsets, setComputedOffsets] = useState<ComputedOffset[]>([]);
  const [view, setView] = useState<View>('home');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Initialize state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as typeof view;
    const postIdParam = params.get('postId');

    if (viewParam && ['home', 'privacy', 'how-it-works', 'blog', 'blog-post', 'login', 'signup', 'dashboard'].includes(viewParam)) {
      setView(viewParam);
      if (viewParam === 'blog-post' && postIdParam) {
        setSelectedPostId(postIdParam);
      }
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = (params.get('view') as typeof view) || 'home';
      const postIdParam = params.get('postId');

      setView(viewParam);
      setSelectedPostId(postIdParam);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle BFCache restoration
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const params = new URLSearchParams(window.location.search);
        const viewParam = (params.get('view') as typeof view) || 'home';
        setView(viewParam);
      }
    };

    window.addEventListener('pageshow', handlePageShow as any);
    return () => window.removeEventListener('pageshow', handlePageShow as any);
  }, []);

  // Navigate function that updates URL
  const navigate = (newView: View, postId?: string) => {
    const params = new URLSearchParams();
    if (newView !== 'home') {
      params.set('view', newView);
    }
    if (postId) {
      params.set('postId', postId);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : '/';

    if (window.location.search !== (params.toString() ? `?${params.toString()}` : '')) {
      window.history.pushState({}, '', newUrl);
    }

    setView(newView);
    setSelectedPostId(postId || null);
    window.scrollTo(0, 0);
  };

  // Auto-redirect to dashboard when user logs in
  useEffect(() => {
    if (isAuthenticated && (view === 'login' || view === 'signup')) {
      navigate('dashboard');
    }
    // Redirect to login if trying to access dashboard while logged out
    if (!authLoading && !isAuthenticated && view === 'dashboard') {
      navigate('home');
    }
  }, [isAuthenticated, authLoading, view]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    const newFiles: FileWithContent[] = [];

    for (const file of selectedFiles) {
      try {
        const content = await file.text();

        // Calculate duration from last timestamp
        let duration: string | null = null;
        try {
          const blocks = permissiveParseSrt(content);
          if (blocks.length > 0) {
            // Get the last block's end time
            const lastBlock = blocks[blocks.length - 1];
            const shifted = shiftTimestampLine(lastBlock.tsRaw, 0);
            if (shifted) {
              const endToken = shifted.split('-->')[1]?.trim();
              if (endToken) {
                duration = endToken;
              }
            }
          }
        } catch (e) {
          // If parsing fails, duration stays null
        }

        // First file uploaded becomes primary if no primary exists yet
        const hasPrimary = files.some(f => f.isPrimary);
        newFiles.push({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: '.' + file.name.split('.').pop()?.toLowerCase() || '.txt',
          size: file.size,
          duration,
          isPrimary: !hasPrimary && files.length === 0 && newFiles.length === 0,
          offset: '00:00:00,000',
          content: [],
          errors: [],
          fileContent: content
        });
      } catch (error) {
        const hasPrimary = files.some(f => f.isPrimary);
        newFiles.push({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: '.' + file.name.split('.').pop()?.toLowerCase() || '.txt',
          size: file.size,
          duration: null,
          isPrimary: !hasPrimary && files.length === 0 && newFiles.length === 0,
          offset: '00:00:00,000',
          content: [],
          errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          fileContent: ''
        });
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleSetPrimary = (id: string) => {
    setFiles(prev => prev.map(f => ({
      ...f,
      isPrimary: f.id === id
    })));
    setMergeResult(null);
    setComputedOffsets([]);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);

      // Update primary status based on new order (first file is primary)
      return newFiles.map((f, idx) => ({
        ...f,
        isPrimary: idx === 0
      }));
    });
    setMergeResult(null);
    setComputedOffsets([]);
  };

  const handleRemove = (id: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      // If we removed the primary file (index 0), make the new first file primary
      return newFiles.map((f, idx) => ({
        ...f,
        isPrimary: idx === 0
      }));
    });
    setMergeResult(null);
    setComputedOffsets([]);
  };

  // Memoize primary file for calculations
  const primaryFile = useMemo(() => files.find(f => f.isPrimary), [files]);

  // Calculate primary file end time
  const primaryEnd = useMemo(() => {
    if (!primaryFile) return '00:00:00,000';

    // Try to get duration from file metadata first
    if (primaryFile.duration) return primaryFile.duration;

    // Fallback to parsing content
    let lastEndMs = 0;
    const lines = primaryFile.fileContent.split('\n');
    for (const line of lines) {
      if (line.includes('-->')) {
        const parts = line.split('-->');
        if (parts.length === 2) {
          const endMs = parseTimestampToMs(parts[1].trim());
          if (endMs !== null && endMs > lastEndMs) {
            lastEndMs = endMs;
          }
        }
      }
    }

    return formatMsToTimestamp(lastEndMs);
  }, [primaryFile]);

  // Convert files to SecondaryFile format for TimelineAlignmentCard (exclude primary)
  const secondaryFiles: SecondaryFile[] = useMemo(() => {
    return files
      .filter(f => !f.isPrimary)
      .map(file => ({
        id: file.id,
        name: file.name,
        currentOffsetMs: parseTimestampToMs(file.offset) ?? 0,
        fileContent: file.fileContent
      }));
  }, [files]);

  // Handle timeline alignment changes
  const handleTimelineAlignmentChange = (payload: {
    mode: 'auto' | 'none' | 'custom';
    customOffset?: string;
    computedOffsets: ComputedOffset[];
  }) => {
    setComputedOffsets(payload.computedOffsets);
  };

  const handleMerge = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setMergeResult(null);

    try {
      // If we have computed offsets, use them to shift files
      if (computedOffsets.length > 0 && files.length > 1 && primaryFile) {
        // Merge with offsets: primary file + shifted secondary files
        const primaryBlocks = permissiveParseSrt(primaryFile.fileContent);

        const allBlocks: Array<{ index: number; timestamp: string; texts: string[] }> = [];
        let globalIndex = 1;

        // Add primary file blocks as-is
        for (const block of primaryBlocks) {
          const shifted = shiftTimestampLine(block.tsRaw, 0);
          if (shifted) {
            allBlocks.push({
              index: globalIndex++,
              timestamp: shifted,
              texts: block.texts.length > 0 ? block.texts : ['[No text]']
            });
          }
        }

        // Add secondary files with their computed offsets
        const secondaryFilesList = files.filter(f => !f.isPrimary);
        for (const file of secondaryFilesList) {
          const offset = computedOffsets.find(o => o.id === file.id);
          const offsetMs = offset?.offsetMs ?? 0;

          const blocks = permissiveParseSrt(file.fileContent);
          for (const block of blocks) {
            const shifted = shiftTimestampLine(block.tsRaw, offsetMs);
            if (shifted) {
              allBlocks.push({
                index: globalIndex++,
                timestamp: shifted,
                texts: block.texts.length > 0 ? block.texts : ['[No text]']
              });
            }
          }
        }

        // Generate merged SRT
        const mergedSrt = allBlocks.map(block => {
          return `${block.index}\n${block.timestamp}\n${block.texts.join('\n')}\n`;
        }).join('\n');

        setMergeResult({
          mergedSrt,
          diagnostics: [],
          stats: {
            totalInputCues: files.reduce((sum, f) => sum + permissiveParseSrt(f.fileContent).length, 0),
            totalOutputCues: allBlocks.length,
            parseIssuesCount: 0,
            filesProcessed: files.length
          }
        });
      } else {
        // Fallback to simple arithmetic merge (original behavior)
        const filesToMerge = files.map(file => ({
          name: file.name,
          content: file.fileContent
        }));

        const result = mergeSrtFiles(filesToMerge);
        setMergeResult(result);
      }

      setToastMessage('Merge completed successfully!');
      setShowToast(true);
    } catch (error) {
      setToastMessage(`Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canMerge = files.length >= 1;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    // Auth views (public)
    if (view === 'login') {
      return <Login onSwitchToSignup={() => navigate('signup')} onBackToHome={() => navigate('home')} />;
    }

    if (view === 'signup') {
      return <Signup onSwitchToLogin={() => navigate('login')} onBackToHome={() => navigate('home')} />;
    }

    // Dashboard (authenticated users only)
    if (view === 'dashboard' && isAuthenticated) {
      return <Dashboard />;
    }

    if (view === 'privacy') {
      return <PrivacyPolicy onBack={() => navigate('home')} />;
    }

    if (view === 'how-it-works') {
      return (
        <HowItWorks
          onBack={() => navigate('home')}
          onStartMerging={() => {
            navigate('home');
            // Wait for render then scroll
            setTimeout(() => {
              const toolElement = document.getElementById('merger-tool');
              toolElement?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      );
    }

    if (view === 'blog') {
      return (
        <Blog
          onBack={() => navigate('home')}
          onReadPost={(id) => navigate('blog-post', id)}
        />
      );
    }

    if (view === 'blog-post' && selectedPostId) {
      const post = blogPosts.find(p => p.id === selectedPostId);
      if (post) {
        return (
          <BlogPost
            post={post}
            onBack={() => navigate('blog')}
          />
        );
      }
      // Post not found - redirect to blog list
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('blog')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Back to Blog
            </button>
          </div>
        </div>
      );
    }

    // Home View
    return (
      <main>
        <Hero onNavigate={(page) => setView(page)} />

        {/* Merger Tool Section */}
        <section id="merger-tool" className="px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Tool Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-xs font-mono text-gray-400">srt_merger_v2.exe</div>
                <div className="w-16"></div> {/* Spacer */}
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                {/* Upload Area */}
                <div className="mb-10">
                  <UploadArea onFilesSelected={handleFilesSelected} />
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mb-10 animate-fade-in">
                    <FileList
                      files={files.map((f, idx) => ({ ...f, isPrimary: idx === 0 }))}
                      onSetPrimary={handleSetPrimary}
                      onRemove={handleRemove}
                      onReorder={handleReorder}
                    />
                  </div>
                )}

                {/* Merge Controls */}
                {files.length > 0 && (
                  <div className="flex flex-col gap-8 mb-10 animate-fade-in">
                    <TimelineAlignmentCard
                      primaryEnd={primaryEnd}
                      secondaryFiles={secondaryFiles}
                      onChange={handleTimelineAlignmentChange}
                    />
                    <MergePreview
                      files={files}
                      computedOffsets={computedOffsets}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                  <button
                    onClick={handleMerge}
                    disabled={!canMerge || isProcessing}
                    className={`
                      flex items-center justify-center px-8 py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all
                      ${!canMerge || isProcessing
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                      }
                    `}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Merge & Download SRT
                      </>
                    )}
                  </button>
                </div>

                {/* Merge Results Stats & Downloads */}
                {mergeResult && (
                  <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-6 sm:p-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <SparklesIcon className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Merge Complete</h3>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="text-xs font-mono text-gray-500 mb-1">FILES</div>
                        <div className="text-2xl font-bold text-gray-900">{mergeResult.stats.filesProcessed}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="text-xs font-mono text-gray-500 mb-1">INPUT CUES</div>
                        <div className="text-2xl font-bold text-gray-900">{mergeResult.stats.totalInputCues}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="text-xs font-mono text-gray-500 mb-1">OUTPUT CUES</div>
                        <div className="text-2xl font-bold text-gray-900">{mergeResult.stats.totalOutputCues}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="text-xs font-mono text-gray-500 mb-1">ISSUES</div>
                        <div className="text-2xl font-bold text-gray-900">{mergeResult.stats.parseIssuesCount}</div>
                      </div>
                    </div>

                    {/* Download Links */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => downloadFile(mergeResult.mergedSrt, 'merged.srt', 'text/plain;charset=utf-8')}
                        className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 font-medium"
                      >
                        <span>📄</span>
                        <span className="truncate">Download merged.srt</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main >
    );
  };

  const hideNavbar = view === 'dashboard' || view === 'login' || view === 'signup';

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans text-zinc-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      {!hideNavbar && <Navbar onNavigate={(page) => navigate(page as View)} />}

      {renderContent()}

      {!hideNavbar && <Footer onOpenPrivacy={() => navigate('privacy')} />}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in z-50 font-medium flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}

export default AppWrapper;
