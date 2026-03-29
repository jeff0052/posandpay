import React, { useState, useEffect } from "react";
import { Users, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueueEntries, addToQueue, type QueueEntry } from "@/state/queue-store";

const QueueKiosk: React.FC = () => {
  const entries = useQueueEntries();
  const [joined, setJoined] = useState<QueueEntry | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [, forceUpdate] = useState(0);

  // Force re-render every 30s to update positions
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const waitingList = entries.filter(e => e.status === "waiting");

  const handleJoin = () => {
    const entry = addToQueue({
      partySize,
      customerName: name || undefined,
      customerPhone: phone || undefined,
      estimatedWait: partySize <= 2 ? 10 : partySize <= 4 ? 15 : 25,
    });
    setJoined(entry);
  };

  // Show current status if already joined
  if (joined) {
    const current = entries.find(e => e.id === joined.id);
    const position = current?.status === "waiting"
      ? waitingList.findIndex(e => e.id === joined.id) + 1
      : 0;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          {current?.status === "seated" ? (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-status-green-light flex items-center justify-center">
                <Check className="h-10 w-10 text-status-green" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Your table is ready!</h1>
              <p className="text-muted-foreground">Please proceed to the host stand.</p>
            </>
          ) : current?.status === "called" ? (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-status-blue-light flex items-center justify-center animate-pulse">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">You've been called!</h1>
              <p className="text-muted-foreground">Please head to the host stand now.</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-accent flex items-center justify-center">
                <span className="text-4xl font-bold text-foreground">{position}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">You're #{position} in line</h1>
              <p className="text-muted-foreground">
                Estimated wait: <span className="font-semibold text-foreground">{current?.estimatedWait || 15} mins</span>
              </p>
              <div className="text-[14px] text-muted-foreground">
                Party of {current?.partySize || partySize} · {current?.customerName || "Guest"}
              </div>
            </>
          )}
          <Button variant="outline" size="lg" className="mt-4" onClick={() => setJoined(null)}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Join the Queue</h1>
          <p className="text-muted-foreground mt-2">
            {waitingList.length === 0 ? "No wait — walk right in!" : `${waitingList.length} ${waitingList.length === 1 ? "party" : "parties"} waiting`}
          </p>
        </div>

        <div className="uniweb-card p-6 space-y-5">
          <div>
            <label className="text-[13px] font-medium text-foreground mb-2 block">Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="w-full h-12 px-4 rounded-xl border-[1.5px] border-border bg-background text-[15px] focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[13px] font-medium text-foreground mb-2 block">Phone Number (optional)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+65 XXXX XXXX" className="w-full h-12 px-4 rounded-xl border-[1.5px] border-border bg-background text-[15px] focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[13px] font-medium text-foreground mb-2 block">Party Size</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                <button key={n} onClick={() => setPartySize(n)} className={cn("h-12 rounded-xl text-[16px] font-bold transition-colors", partySize === n ? "bg-primary text-primary-foreground" : "bg-accent text-foreground hover:bg-secondary")}>{n}</button>
              ))}
            </div>
          </div>
          <Button size="lg" className="w-full h-14 text-[16px] rounded-xl" onClick={handleJoin}>
            Join Queue
          </Button>
        </div>

        {waitingList.length > 0 && (
          <div className="text-center text-[13px] text-muted-foreground">
            <Clock className="inline h-4 w-4 mr-1" />
            Estimated wait: ~{partySize <= 2 ? 10 : partySize <= 4 ? 15 : 25} mins
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueKiosk;
