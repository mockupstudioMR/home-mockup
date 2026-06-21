import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

interface Props {
  onFallback: () => void;
}

const WhatsAppQuizCard = ({ onFallback }: Props) => {
  const [phone, setPhone] = useState("+");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const send = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-quiz-start", { body: { phone } });
      if (error) throw error;
      const payload = data as { ok?: boolean; sessionId?: string; error?: string };
      if (payload?.error) throw new Error(payload.error);
      setSent(true);
      toast({ title: "Quiz sent to WhatsApp 👋", description: "Open WhatsApp to continue." });
    } catch (e) {
      toast({ title: "Couldn't send", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-600">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Take the quiz on WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            We'll text you the questions. Visual questions (style, colors, inspiration) open a quick link to pick on your phone.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-center">
            ✅ Sent! Open WhatsApp and reply to start. When the quiz is done you'll get a link back here.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Your WhatsApp number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+14155550123"
                inputMode="tel"
              />
              <p className="text-xs text-muted-foreground">Include country code (E.164 format).</p>
            </div>
            <Button onClick={send} disabled={sending || phone.length < 8} className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              {sending ? "Sending…" : "Send me the quiz"}
            </Button>
          </div>
        )}

        <button onClick={onFallback} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground underline">
          Prefer to answer here instead?
        </button>
      </CardContent>
    </Card>
  );
};

export default WhatsAppQuizCard;