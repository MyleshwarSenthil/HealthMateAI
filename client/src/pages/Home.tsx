import { AIChatBox } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Activity, ArrowUpRight, BellRing, BrainCircuit, CalendarCheck, Check,
  ChevronRight, CircleHelp, FileScan, HeartPulse, Leaf, Loader2, LockKeyhole,
  MessageCircleHeart, Plus, ShieldCheck, Sparkles, Stethoscope, Upload, X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const logoUrl = "/manus-storage/healthmate-logo_d237c75e.png";
const reportImageUrl = "/manus-storage/healthmate-document-hero_8df542e7.jpg";
const chatImageUrl = "/manus-storage/healthmate-chat-illustration_e217da3c.jpg";
const careImageUrl = "/manus-storage/healthmate-care-illustration_ea6c8c20.jpg";
const preventiveImageUrl = "/manus-storage/healthmate-preventive-illustration_a6ffc7ff.jpg";

type ModuleId = "insight" | "questions" | "assistant" | "prevent";
type ReportResult = {
  overview: string;
  signals: Array<{ title: string; plainLanguage: string; direction: "stated" | "worth_discussing" | "missing_context" }>;
  nextSteps: string[];
  questionsForClinician: string[];
  safetyNotice: string;
};
type ChatMessage = { role: "user" | "assistant"; content: string };
type CarePlan = {
  urgent: boolean;
  reflection: string;
  actions: Array<{ title: string; action: string; cadence: string }>;
  clinicianPrompt: string;
  safetyNote: string;
};

const modules: Array<{ id: ModuleId; label: string; index: string; icon: typeof FileScan; description: string }> = [
  { id: "insight", label: "Report insight", index: "01", icon: FileScan, description: "Turn a document into clearer context." },
  { id: "questions", label: "Ask HealthMate", index: "02", icon: MessageCircleHeart, description: "Explore general health & medicine questions." },
  { id: "assistant", label: "Care assistant", index: "03", icon: BrainCircuit, description: "Shape small, realistic wellbeing routines." },
  { id: "prevent", label: "Preventive care", index: "04", icon: Leaf, description: "Keep healthy habits and follow-ups visible." },
];

const reportDirectionStyle = {
  stated: "bg-[#e8efff] text-[#2458e6]",
  worth_discussing: "bg-[#fff1eb] text-[#b54d34]",
  missing_context: "bg-[#edf4ee] text-[#2f7659]",
};

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleId>("insight");
  const [report, setReport] = useState<ReportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi — I can explain general health and medicine topics in clear language. I won’t diagnose or replace a clinician. What would you like to understand?" },
  ]);
  const [focus, setFocus] = useState<"sleep" | "energy" | "nutrition" | "movement" | "stress">("energy");
  const [routine, setRoutine] = useState("");
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [habits, setHabits] = useState([true, false, true]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reportMutation = trpc.health.analyzeDocument.useMutation({
    onSuccess: (data) => {
      setReport(data as ReportResult);
      toast.success("Your educational report context is ready.");
    },
    onError: (error) => toast.error(error.message || "We could not review that file. Please try another supported document."),
  });
  const chatMutation = trpc.health.chat.useMutation({
    onSuccess: (data) => setChatMessages((messages) => [...messages, { role: "assistant", content: data.answer }]),
    onError: () => {
      setChatMessages((messages) => [...messages, { role: "assistant", content: "I’m not able to respond right now. For urgent health concerns, please contact local emergency services or a licensed clinician." }]);
    },
  });
  const coachMutation = trpc.health.careCoach.useMutation({
    onSuccess: (data) => setCarePlan(data as CarePlan),
    onError: (error) => toast.error(error.message || "Please try creating your wellbeing plan again."),
  });

  const visitModule = (id: ModuleId) => {
    setActiveModule(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitFile = (file: File) => {
    const accepted = ["application/pdf", "image/png", "image/jpeg", "text/plain"];
    if (!accepted.includes(file.type)) {
      toast.error("Choose a PDF, PNG, JPG, or plain-text report.");
      return;
    }
    if (file.size > 620_000) {
      toast.error("For this prototype, please choose a report under 620 KB.");
      return;
    }
    setSelectedFile(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      if (file.type === "text/plain") {
        reportMutation.mutate({ fileName: file.name, mimeType: "text/plain", reportText: result });
      } else {
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        reportMutation.mutate({ fileName: file.name, mimeType: file.type as "application/pdf" | "image/png" | "image/jpeg", fileData: base64 });
      }
    };
    if (file.type === "text/plain") reader.readAsText(file);
    else reader.readAsDataURL(file);
  };

  const useSampleReport = () => {
    setSelectedFile("example-routine-lab-note.txt");
    reportMutation.mutate({
      fileName: "example-routine-lab-note.txt",
      mimeType: "text/plain",
      reportText: "Example only — routine report note: A clinician requested a follow-up appointment to discuss the report. This note does not include reference ranges, a diagnosis, or a treatment plan. Please bring the original report to the appointment.",
    });
  };

  const sendHealthQuestion = (content: string) => {
    const nextMessages = [...chatMessages, { role: "user" as const, content }];
    setChatMessages(nextMessages);
    chatMutation.mutate({ messages: nextMessages.slice(-10) });
  };

  const createCarePlan = () => {
    if (routine.trim().length < 8) {
      toast.error("Add a little routine context so the suggestions can stay practical.");
      return;
    }
    coachMutation.mutate({ focus, routine: routine.trim() });
  };

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#24324f] selection:bg-[#dfe8ff]">
      <div className="paper-grain fixed inset-0 -z-10" />
      <aside className="nav-rail fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col bg-[#fbfaf6]/90 px-5 py-6 backdrop-blur lg:flex">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 px-2 text-left">
          <img src={logoUrl} alt="HealthMate AI" className="h-10 w-10 rounded-xl object-contain soft-ring" />
          <span><strong className="block text-[15px] font-extrabold tracking-[-0.04em]">HealthMate AI</strong><small className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#7180a1]">Health context, clearly</small></span>
        </button>
        <nav className="mt-12 space-y-2" aria-label="HealthMate modules">
          {modules.map((module) => {
            const Icon = module.icon;
            const active = activeModule === module.id;
            return <button key={module.id} onClick={() => visitModule(module.id)} className={cn("group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200", active ? "bg-[#e9efff] text-[#2458e6] shadow-[0_8px_16px_-14px_rgba(36,88,230,0.7)]" : "text-[#64708b] hover:bg-[#f0eee8] hover:text-[#24324f]") }>
              <span className={cn("grid h-9 w-9 place-items-center rounded-xl transition-colors", active ? "bg-[#2458e6] text-white" : "bg-[#f0eee8] text-[#70809e] group-hover:bg-white")}><Icon size={17} strokeWidth={2.1} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold tracking-[-0.025em]">{module.label}</span><span className="mt-0.5 block truncate text-[10px] font-semibold text-[#8893aa]">{module.description}</span></span>
              <ChevronRight className={cn("h-4 w-4 transition-transform", active && "translate-x-0.5")} />
            </button>;
          })}
        </nav>
        <div className="mt-auto rounded-[22px] border border-[#dbe4ff] bg-[#f2f5ff] p-4">
          <ShieldCheck className="h-5 w-5 text-[#2458e6]" />
          <p className="mt-3 text-xs font-extrabold leading-5 text-[#30446e]">Context, not a diagnosis.</p>
          <p className="mt-1 text-[11px] leading-5 text-[#63718e]">For symptoms that feel urgent or severe, seek local emergency care.</p>
        </div>
      </aside>

      <main className="lg:ml-[272px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e6e3da]/80 bg-[#fbfaf6]/90 px-4 backdrop-blur md:px-8 lg:px-10">
          <button className="flex items-center gap-2 lg:hidden" onClick={() => visitModule("insight")}><img src={logoUrl} alt="" className="h-8 w-8" /><span className="text-sm font-extrabold">HealthMate AI</span></button>
          <p className="hidden text-xs font-bold uppercase tracking-[0.16em] text-[#8390a8] lg:block">Personal health desk / <span className="text-[#2458e6]">today</span></p>
          <div className="flex items-center gap-3"><button onClick={() => toast.message("Reminder settings can be connected in a next iteration.")} className="grid h-9 w-9 place-items-center rounded-xl border border-[#e4e3dd] bg-white text-[#697896] transition hover:border-[#b7c7f9] hover:text-[#2458e6]" aria-label="View reminders"><BellRing size={16} /></button><div className="grid h-9 w-9 place-items-center rounded-full bg-[#273a66] text-xs font-extrabold text-white">HM</div></div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-10 lg:px-10">
          <section className="rise-in grid gap-6 xl:grid-cols-[1.24fr_0.76fr]">
            <div className="rounded-[30px] bg-[#263b70] p-7 text-white md:p-10">
              <div className="flex items-center justify-between"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#dfe8ff]">Your health workspace</span><Activity className="h-5 w-5 text-[#9bb4ff]" /></div>
              <h1 className="font-display mt-8 max-w-xl text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">A clearer way to hold your health information.</h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-[#cbd7f8]">Read a report in plain language, explore general questions, and build a gentle preventive-care rhythm — while keeping clinical decisions with clinicians.</p>
              <div className="mt-8 flex flex-wrap gap-3"><Button onClick={() => visitModule("insight")} className="h-11 rounded-xl bg-white px-5 text-xs font-extrabold text-[#263b70] hover:bg-[#e8eeff]">Review a report <ArrowUpRight className="ml-2 h-4 w-4" /></Button><button onClick={() => visitModule("questions")} className="rounded-xl px-4 text-xs font-extrabold text-[#dfe8ff] transition hover:bg-white/10">Ask a question</button></div>
            </div>
            <div className="rise-in-delay relative min-h-[310px] overflow-hidden rounded-[30px] bg-[#e8edf9] panel-shadow"><img src={reportImageUrl} alt="Person reviewing a health report" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#263b70]/85 via-[#263b70]/35 to-transparent p-7 pt-20"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#cbd7f8]">A practical boundary</p><p className="mt-2 max-w-sm text-sm font-bold leading-6 text-white">HealthMate helps you prepare, understand, and ask better questions. It does not replace professional care.</p></div></div>
          </section>

          <section className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e8e4dc] bg-white/80 p-5"><span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8792aa]">Today’s focus</span><p className="mt-2 text-lg font-extrabold tracking-[-0.04em]">Understand before acting</p><p className="mt-1 text-xs leading-5 text-[#73809b]">Bring original records and questions to your clinician.</p></div>
            <div className="rounded-2xl border border-[#e8e4dc] bg-white/80 p-5"><span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8792aa]">Care rhythm</span><div className="mt-3 flex items-end gap-3"><span className="font-display text-4xl text-[#2f7659]">2/3</span><p className="pb-1 text-xs text-[#73809b]">gentle habits checked today</p></div></div>
            <div className="rounded-2xl border border-[#e8e4dc] bg-white/80 p-5"><span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8792aa]">Next conversation</span><div className="mt-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0e9] text-[#d6644e]"><CalendarCheck size={17} /></span><p className="text-xs font-bold leading-5">Keep a clinician question list ready when you have a follow-up.</p></div></div>
          </section>

          <section id="insight" className="scroll-mt-24 mt-16">
            <SectionLead number="01" icon={FileScan} eyebrow="Document insight" title="Your report, in clearer language." body="Upload a health document to create an informational explanation of what it visibly says. It will not diagnose or determine your health state." />
            <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="overflow-hidden rounded-[28px] border border-[#e6e3dc] bg-white panel-shadow"><div className="relative h-40 overflow-hidden"><img src={reportImageUrl} alt="Health report review" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-[#253a70]/20" /></div><div className="p-6"><div className="flex items-center gap-2 text-[#2458e6]"><LockKeyhole size={14} /><span className="text-[10px] font-extrabold uppercase tracking-[0.15em]">Consent-led prototype</span></div><h3 className="mt-3 text-lg font-extrabold tracking-[-0.04em]">Review one document at a time.</h3><p className="mt-2 text-xs leading-5 text-[#74819a]">Use a non-sensitive practice file for your college demo. This is an on-demand educational review, not a clinical record system.</p><input ref={fileInputRef} onChange={(event) => { const file = event.target.files?.[0]; if (file) submitFile(file); }} accept=".pdf,.png,.jpg,.jpeg,.txt" className="hidden" type="file" />
                <Button onClick={() => fileInputRef.current?.click()} disabled={reportMutation.isPending} className="mt-5 h-11 w-full rounded-xl bg-[#2458e6] text-xs font-extrabold hover:bg-[#1d47bd]"><Upload className="mr-2 h-4 w-4" />{reportMutation.isPending ? "Reading document…" : "Choose a report"}</Button>
                <button onClick={useSampleReport} disabled={reportMutation.isPending} className="mt-3 w-full text-center text-[11px] font-extrabold text-[#566887] transition hover:text-[#2458e6]">Or explore with an example note</button>
              </div></div>
              <div className="min-h-[390px] rounded-[28px] border border-[#e6e3dc] bg-[#fffefb] p-5 md:p-7 panel-shadow">
                {reportMutation.isPending ? <div className="flex h-[330px] flex-col items-center justify-center text-center"><Loader2 className="h-7 w-7 animate-spin text-[#2458e6]" /><p className="mt-4 text-sm font-extrabold">Creating a plain-language context</p><p className="mt-2 max-w-sm text-xs leading-5 text-[#74819a]">The assistant is checking only what appears in the supplied file and will mark missing information.</p></div> : report ? <ReportContext report={report} fileName={selectedFile} /> : <div className="flex h-[330px] flex-col justify-between"><div><div className="flex items-center justify-between"><span className="rounded-full bg-[#e9efff] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#2458e6]">Ready when you are</span><CircleHelp className="h-5 w-5 text-[#9aa5b9]" /></div><h3 className="font-display mt-8 max-w-md text-3xl leading-[1.06] tracking-[-0.04em]">We’ll make the wording easier to follow, not make the decision for you.</h3><p className="mt-4 max-w-xl text-sm leading-6 text-[#71809b]">You’ll see stated details, where context is missing, and practical questions to bring to a qualified clinician.</p></div><div className="border-t border-[#ece8df] pt-4 text-xs font-semibold text-[#697794]">Supports PDF, JPG, PNG, and TXT files up to 620 KB for this prototype.</div></div>}
              </div>
            </div>
          </section>

          <section id="questions" className="scroll-mt-24 mt-16">
            <SectionLead number="02" icon={MessageCircleHeart} eyebrow="Health & medicine Q&A" title="Ask for context, not conclusions." body="Explore general health and medicine questions in a conversational space designed to keep uncertainty visible." />
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <AIChatBox messages={chatMessages} onSendMessage={sendHealthQuestion} isLoading={chatMutation.isPending} height="570px" placeholder="Ask a general health or medicine question…" emptyStateMessage="Ask HealthMate a general question" suggestedPrompts={["What does a follow-up appointment usually help clarify?", "What should I ask a pharmacist before using an over-the-counter medicine?", "How can I prepare for a routine health check-up?"]} className="overflow-hidden rounded-[28px] border-[#e6e3dc] bg-[#fffefb] panel-shadow" />
              <div className="relative overflow-hidden rounded-[28px] bg-[#eff4f1] p-7 panel-shadow"><img src={chatImageUrl} alt="Abstract HealthMate chat illustration" className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-multiply" /><div className="relative"><span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#2f7659]">Safe by design</span><h3 className="font-display mt-7 max-w-sm text-3xl leading-[1.02] tracking-[-0.04em] text-[#263b70]">A little more clarity before your next conversation.</h3><div className="mt-8 space-y-4">{[["General information", "Explains concepts in everyday language."],["Medication boundaries", "No dosage changes or personal prescribing."],["Urgent-care cue", "Flags emergency-type wording for immediate help."]].map(([title, text]) => <div key={title} className="flex gap-3 rounded-2xl bg-white/75 p-4 backdrop-blur"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7659]" /><div><p className="text-xs font-extrabold text-[#263b70]">{title}</p><p className="mt-1 text-[11px] leading-5 text-[#687896]">{text}</p></div></div>)}</div></div></div>
            </div>
          </section>

          <section id="assistant" className="scroll-mt-24 mt-16">
            <SectionLead number="03" icon={BrainCircuit} eyebrow="Personal care assistant" title="Small routines, shaped around real life." body="Share a general wellbeing focus and routine context. HealthMate will suggest low-pressure ideas, not a medical plan." />
            <div className="mt-6 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
              <div className="relative overflow-hidden rounded-[28px] bg-[#2f7659] p-7 text-white panel-shadow"><img src={careImageUrl} alt="Personal care illustration" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity" /><div className="relative"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#e0f4e9]">Start with one focus</span><h3 className="font-display mt-7 text-3xl leading-[1.02] tracking-[-0.04em]">The most helpful plan is the one you’ll actually revisit.</h3><p className="mt-4 text-xs leading-6 text-[#d9f1e3]">This module gives general wellbeing ideas and a prompt to take to a clinician. It does not monitor symptoms or make health decisions.</p><div className="mt-8 rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a7d9bd]">Good first inputs</p><p className="mt-2 text-xs font-bold leading-5 text-white">"My sleep feels inconsistent around exams."<br />"I want a more regular way to take movement breaks."</p></div></div></div>
              <div className="rounded-[28px] border border-[#e6e3dc] bg-white p-6 md:p-7 panel-shadow"><div className="flex flex-wrap gap-2">{(["sleep", "energy", "nutrition", "movement", "stress"] as const).map((item) => <button key={item} onClick={() => setFocus(item)} className={cn("rounded-full px-4 py-2 text-xs font-extrabold capitalize transition", focus === item ? "bg-[#2458e6] text-white" : "bg-[#f1f0eb] text-[#5e6e89] hover:bg-[#e5ebfc]")}>{item}</button>)}</div><label className="mt-6 block text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#6d7c96]">What does your current routine look like?</label><Textarea value={routine} onChange={(event) => setRoutine(event.target.value)} placeholder="For example: I study late most weekdays and I would like a more regular wind-down routine. I do not want medical advice — just gentle wellbeing ideas." className="mt-3 min-h-32 rounded-2xl border-[#e3e2dc] bg-[#fdfcf9] p-4 text-sm leading-6 focus-visible:ring-[#2458e6]" /><div className="mt-3 flex items-center justify-between gap-4"><p className="text-[10px] leading-4 text-[#7b879d]">Avoid names, record numbers, detailed symptoms, or medication directions in this college prototype.</p><span className="shrink-0 text-[10px] font-bold text-[#94a0b3]">{routine.length}/900</span></div><Button onClick={createCarePlan} disabled={coachMutation.isPending} className="mt-5 h-11 rounded-xl bg-[#2f7659] px-5 text-xs font-extrabold hover:bg-[#235a43]">{coachMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{coachMutation.isPending ? "Shaping ideas…" : "Create a gentle plan"}</Button>
                {carePlan && <CarePlanResult plan={carePlan} />}
              </div>
            </div>
          </section>

          <section id="prevent" className="scroll-mt-24 mt-16 pb-10">
            <SectionLead number="04" icon={Leaf} eyebrow="Preventive care" title="A fourth module: keep preventative care visible." body="Use a simple weekly rhythm to notice routines, prepare for appointments, and turn good intentions into small prompts." />
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-[#e6e3dc] bg-white p-6 md:p-7 panel-shadow"><div className="flex items-start justify-between"><div><span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#70809b]">This week’s gentle check-in</span><h3 className="mt-2 text-xl font-extrabold tracking-[-0.04em]">Three small ways to stay prepared</h3></div><div className="grid h-12 w-12 place-items-center rounded-full border-[6px] border-[#e9efff] text-xs font-extrabold text-[#2458e6]">{habits.filter(Boolean).length}/3</div></div><div className="mt-7 space-y-3">{[["Pause for a routine check-in", "A two-minute note about sleep, energy, or stress — without drawing conclusions."],["Prepare one clinician question", "Keep the question in a place you’ll find before your next appointment."],["Choose a movement or rest cue", "Set one realistic cue that respects your comfort and schedule."]].map(([title, body], index) => <button key={title} onClick={() => setHabits((current) => current.map((item, itemIndex) => itemIndex === index ? !item : item))} className="flex w-full items-center gap-4 rounded-2xl border border-[#edeae2] p-4 text-left transition hover:border-[#b8c7ef] hover:bg-[#fbfcff]"><span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border transition", habits[index] ? "border-[#2f7659] bg-[#2f7659] text-white" : "border-[#ccd5df] bg-white text-transparent")}><Check size={15} strokeWidth={3} /></span><span className="flex-1"><span className="block text-xs font-extrabold text-[#263b70]">{title}</span><span className="mt-1 block text-[11px] leading-5 text-[#71809a]">{body}</span></span></button>)}</div></div>
              <div className="relative overflow-hidden rounded-[28px] bg-[#fff0e9] p-7 panel-shadow"><img src={preventiveImageUrl} alt="Preventive care illustration" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-multiply" /><div className="relative"><span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#b54d34]">Prevention is preparation</span><h3 className="font-display mt-7 max-w-sm text-3xl leading-[1.02] tracking-[-0.04em] text-[#493641]">Keep the questions, not just the appointments.</h3><p className="mt-4 max-w-sm text-xs leading-6 text-[#775b62]">The goal is not to make decisions alone. It is to notice what may be useful to bring into a professional conversation.</p><button onClick={() => toast.message("You can add a calendar connection in a future iteration of the project.")} className="mt-8 flex items-center gap-2 rounded-xl bg-[#263b70] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#1e2e59]"><Plus size={15} /> Add a preventive-care reminder</button></div></div>
            </div>
          </section>

          <footer className="border-t border-[#e6e3dc] py-8 text-center"><p className="text-xs font-extrabold text-[#53647f]">HealthMate AI is an educational prototype for your college project.</p><p className="mx-auto mt-2 max-w-2xl text-[11px] leading-5 text-[#8995aa]">It does not diagnose, monitor emergencies, prescribe, or replace a licensed clinician. If you think you have an emergency, contact your local emergency number or go to the nearest emergency department.</p></footer>
        </div>
      </main>
    </div>
  );
}

function SectionLead({ number, icon: Icon, eyebrow, title, body }: { number: string; icon: typeof FileScan; eyebrow: string; title: string; body: string }) {
  return <div className="grid gap-4 md:grid-cols-[72px_1fr] md:items-end"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9efff] text-[#2458e6]"><Icon size={22} /></div><div><div className="flex items-center gap-3"><span className="text-[10px] font-extrabold tracking-[0.16em] text-[#2458e6]">{number}</span><span className="h-px w-7 bg-[#b5c5f7]" /><span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#7888a4]">{eyebrow}</span></div><h2 className="font-display mt-2 text-3xl leading-none tracking-[-0.04em] text-[#263b70] md:text-4xl">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#71809a]">{body}</p></div></div>;
}

function ReportContext({ report, fileName }: { report: ReportResult; fileName: string }) {
  return <div><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece8df] pb-5"><div><span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#2f7659]">Educational context generated</span><h3 className="mt-1 text-lg font-extrabold tracking-[-0.04em]">{fileName}</h3></div><button onClick={() => window.print()} className="rounded-xl border border-[#dfdfda] bg-white px-3 py-2 text-[10px] font-extrabold text-[#60708b] transition hover:border-[#aabcf1] hover:text-[#2458e6]">Print summary</button></div><p className="mt-5 text-sm font-semibold leading-6 text-[#3d4c69]">{report.overview}</p>{report.signals.length > 0 && <div className="mt-5 grid gap-3 md:grid-cols-2">{report.signals.map((signal) => <div key={signal.title} className="rounded-2xl bg-[#f8f8f5] p-4"><span className={cn("inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em]", reportDirectionStyle[signal.direction])}>{signal.direction.replace("_", " ")}</span><p className="mt-3 text-xs font-extrabold text-[#2b3d64]">{signal.title}</p><p className="mt-1 text-[11px] leading-5 text-[#73809a]">{signal.plainLanguage}</p></div>)}</div>}<div className="mt-5 grid gap-5 border-t border-[#ece8df] pt-5 md:grid-cols-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#70809b]">Helpful next steps</p><ul className="mt-3 space-y-2">{report.nextSteps.map((step) => <li key={step} className="flex gap-2 text-[11px] leading-5 text-[#53657f]"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2458e6]" />{step}</li>)}</ul></div><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#70809b]">Ask a clinician</p><ul className="mt-3 space-y-2">{report.questionsForClinician.map((question) => <li key={question} className="flex gap-2 text-[11px] leading-5 text-[#53657f]"><Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2f7659]" />{question}</li>)}</ul></div></div><div className="mt-5 flex gap-3 rounded-2xl bg-[#fff4ef] p-4"><HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-[#c35a40]" /><p className="text-[11px] leading-5 text-[#7d554a]">{report.safetyNotice}</p></div></div>;
}

function CarePlanResult({ plan }: { plan: CarePlan }) {
  if (plan.urgent) return <div className="mt-6 rounded-2xl bg-[#fff0ec] p-5"><p className="text-xs font-extrabold text-[#a84431]">Please seek immediate help</p><p className="mt-2 text-xs leading-5 text-[#7c544e]">{plan.reflection}</p></div>;
  return <div className="mt-7 border-t border-[#ece8df] pt-6"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#2f7659]">Your gentle wellbeing plan</p><p className="mt-2 text-sm font-bold leading-6 text-[#304460]">{plan.reflection}</p><div className="mt-5 grid gap-3 md:grid-cols-3">{plan.actions.map((item) => <div key={item.title} className="rounded-2xl bg-[#f1f7f3] p-4"><p className="text-xs font-extrabold text-[#245a45]">{item.title}</p><p className="mt-2 text-[11px] leading-5 text-[#557766]">{item.action}</p><span className="mt-3 inline-block rounded-full bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#2f7659]">{item.cadence}</span></div>)}</div><div className="mt-5 grid gap-3 md:grid-cols-2"><div className="rounded-2xl bg-[#eef2ff] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2458e6]">Bring this question</p><p className="mt-2 text-[11px] font-semibold leading-5 text-[#49618e]">{plan.clinicianPrompt}</p></div><div className="rounded-2xl bg-[#fff5ef] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#bf5c42]">Safety note</p><p className="mt-2 text-[11px] font-semibold leading-5 text-[#7d5b52]">{plan.safetyNote}</p></div></div></div>;
}
