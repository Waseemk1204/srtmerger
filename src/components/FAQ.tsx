import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "What file formats are supported?",
        answer: "Our tool is optimized for SRT (SubRip) files, which are the most common subtitle format. We also provide basic support for other text-based subtitle formats like VTT and TXT files."
    },
    {
        question: "How many files can I merge at once?",
        answer: "You can merge multiple SRT files in a single operation. The exact number depends on your plan: Free users get 4 uploads per day, Basic gets 20, Pro gets 100, and Unlimited plan has no restrictions."
    },
    {
        question: "Do I need to create an account to use the tool?",
        answer: "No! You can use the basic merging features without an account. However, creating a free account gives you access to additional features like cloud storage and merge history."
    },
    {
        question: "How does the 24-hour rolling window work?",
        answer: "Your daily upload limit resets 24 hours after your first merge of the day. For example, if you make your first merge at 2 PM, your limit will reset at 2 PM the next day. This is a rolling window, not a fixed daily reset."
    },
    {
        question: "What's the difference between free and paid plans?",
        answer: "Free plan includes 4 merges per day with basic features. Paid plans offer higher daily limits (20-unlimited), advanced features like timeline alignment, merge preview, file renaming, and cloud storage with longer retention periods."
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes! You can cancel your subscription at any time from your dashboard. Your access to premium features will continue until the end of your current billing period, and you won't be charged again."
    },
    {
        question: "What if I encounter issues or need support?",
        answer: "If you run into any problems, please contact us through the link in the footer. We typically respond within 24 hours and are happy to help with any technical issues or questions about your subscription."
    },
    {
        question: "Will merging affect the quality or timing of my subtitles?",
        answer: "No! Our tool preserves the exact timing and formatting of your original SRT files. We use a permissive parser that handles various SRT formats and edge cases, ensuring your subtitles remain perfectly synchronized."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const displayedFAQs = showAll ? faqs : faqs.slice(0, 3);

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Frequently Asked Questions about SRT Merging
                    </h2>
                    <p className="text-lg text-gray-600">
                        Everything you need to know about our SRT merger tool
                    </p>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {displayedFAQs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden transition-all hover:border-gray-300"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 pr-4">
                                    {faq.question}
                                </span>
                                <ChevronDownIcon
                                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${openIndex === index ? 'transform rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-4 text-gray-600 animate-fade-in">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Show More/Less Button */}
                {faqs.length > 3 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            {showAll ? 'Show Less' : `Show More (${faqs.length - 3} more)`}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
