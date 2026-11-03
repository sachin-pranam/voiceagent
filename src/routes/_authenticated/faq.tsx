import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/faq")({
  component: FAQPage,
});

function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      category: "Getting Started",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      questions: [
        {
          id: "getting-started-1",
          question: "How do I create my first account?",
          answer: "To create an account, click on the 'Sign Up' button and fill in your email address. You'll receive a verification email to complete the registration process.",
        },
        {
          id: "getting-started-2",
          question: "What are the system requirements?",
          answer: "Awaaz AI works on any modern web browser (Chrome, Firefox, Safari, Edge). No additional software installation is required. For mobile access, we recommend using the latest version of your mobile browser.",
        },
        {
          id: "getting-started-3",
          question: "How do I navigate the dashboard?",
          answer: "The main navigation is located in the left sidebar. You can access Calls, Dashboard, Knowledge Base, and admin features (if you're an administrator) from there. The theme switcher is located in the top-right corner.",
        },
      ],
    },
    {
      category: "Call Management",
      color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      questions: [
        {
          id: "calls-1",
          question: "How do I view my call history?",
          answer: "Navigate to the 'Calls' section from the sidebar. Here you can see all your recent calls with details like caller information, call type, and timestamp. You can also filter and search through your call history.",
        },
        {
          id: "calls-2",
          question: "Can I listen to recorded calls?",
          answer: "Yes, if call recording is enabled, you'll see a play button next to recorded calls in your call history. Click it to listen to the audio recording.",
        },
        {
          id: "calls-3",
          question: "How do I export call data?",
          answer: "You can export your call data from the Calls page. Look for the 'Export' button which allows you to download your call history in CSV or PDF format.",
        },
      ],
    },
    {
      category: "Account & Settings",
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      questions: [
        {
          id: "account-1",
          question: "How do I change my password?",
          answer: "Go to Settings from the sidebar, then click on 'Security'. You can update your password there. Make sure to use a strong password with at least 8 characters.",
        },
        {
          id: "account-2",
          question: "Can I change the theme?",
          answer: "Yes! Use the theme switcher in the top-right corner of the header. You can choose from Light, Dark, Blue, Green, or Purple themes.",
        },
        {
          id: "account-3",
          question: "How do I update my profile information?",
          answer: "Visit the Settings page from the sidebar menu. You can update your name, email, and other profile information there.",
        },
      ],
    },
    {
      category: "Technical Issues",
      color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      questions: [
        {
          id: "tech-1",
          question: "The page is not loading properly",
          answer: "Try refreshing the page (Ctrl+F5 or Cmd+Shift+R). If the issue persists, clear your browser cache and cookies, or try using an incognito/private browsing window.",
        },
        {
          id: "tech-2",
          question: "Audio is not playing",
          answer: "Ensure your browser allows audio playback and that your volume is turned up. Check if other websites can play audio. You may need to enable audio permissions for this site.",
        },
        {
          id: "tech-3",
          question: "I'm getting a 'Network Error' message",
          answer: "Check your internet connection. If you're on a corporate network, contact your IT department as there might be firewall restrictions. Try accessing the site from a different network if possible.",
        },
      ],
    },
    {
      category: "Admin Features",
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      questions: [
        {
          id: "admin-1",
          question: "How do I add new users?",
          answer: "As an admin, navigate to the 'Users' section in the Administration panel. Click 'Add User' and fill in the required information. The new user will receive an invitation email.",
        },
        {
          id: "admin-2",
          question: "How do I manage user permissions?",
          answer: "In the Users section, click on any user to edit their permissions. You can change their role between 'User' and 'Admin', or activate/deactivate their account.",
        },
        {
          id: "admin-3",
          question: "Can I view system-wide analytics?",
          answer: "Yes, admin users have access to system-wide analytics in the Admin Panel. This includes user activity, call volumes, and system performance metrics.",
        },
      ],
    },
  ];

  const allQuestions = faqCategories.flatMap((cat) => 
    cat.questions.map((q) => ({ ...q, category: cat.category, color: cat.color }))
  );

  const filteredQuestions = searchTerm
    ? allQuestions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
      </div>

      <p className="text-muted-foreground">
        Find answers to common questions about Awaaz AI. Can't find what you're looking for? Contact our support team.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search FAQ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Search Results ({filteredQuestions.length})
          </h2>
          {filteredQuestions.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-2">
              {filteredQuestions.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className={item.color} variant="secondary">
                        {item.category}
                      </Badge>
                      <span>{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <HelpCircle className="size-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  Try different keywords or browse the categories below.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* FAQ Categories */}
      {!searchTerm && (
        <div className="space-y-6">
          {faqCategories.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className={category.color} variant="secondary">
                    {category.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="border-0">
                      <AccordionTrigger className="text-left hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}