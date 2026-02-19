import { Shield, Lock, AlertTriangle, ChevronLeft, HelpCircle, Zap } from 'lucide-react';
import diagram from '@/assets/diagram.svg';

const Learn = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to App
      </button>

      <section className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Understanding Bitcoin Will</h1>
        <p className="text-xl text-foreground/60 leading-relaxed">
          TIP (TimeLock Inheritance Protocol) defines the inheritance pattern, and Bitcoin Will provides a non-custodial implementation you can use in practice.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="text-primary w-6 h-6" /> Two Spending Paths
        </h2>
        <div className="glass p-8 flex justify-center bg-white/5">
          <img src={diagram} alt="Logic Flow" className="max-w-full h-auto" loading="lazy" />
        </div>
        <p className="text-sm text-foreground/60 text-center">
          The Vault Address protects your Bitcoin with a branching rule.
        </p>
      </section>

      <div className="grid gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
            <Shield className="w-4 h-4" /> What it is NOT
          </div>
          <div className="glass p-6 border-red-500/20 bg-red-500/5">
            <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80">
              <li><strong>Not a Wallet:</strong> We do not store your Bitcoin or your private keys.</li>
              <li><strong>Not Custody:</strong> No one but you (and eventually your heir) has access to the funds.</li>
              <li><strong>Not Legal Advice:</strong> This is a technical tool. Consult a lawyer for estate planning.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
            <Lock className="w-4 h-4" /> The Basic Idea
          </div>
          <p className="text-foreground/70 leading-relaxed">
            You deposit Bitcoin into a special "Vault Address." This address has a built-in rule: 
            <strong> You</strong> can move the money whenever you want. 
            However, if you don't move the money for a set period (the "Timelock"), 
            your <strong>Beneficiary</strong> gains the right to claim it.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
            <HelpCircle className="w-4 h-4" /> How the Timelock Works
          </div>
          <div className="space-y-4 text-foreground/70">
            <p>
              We use a Bitcoin feature called <code>CheckSequenceVerify</code> (CSV). 
              This is a "Relative Timelock."
            </p>
            <ul className="space-y-2 text-sm">
              <li>• The "Timer" starts <strong>after</strong> your funding transaction is confirmed.</li>
              <li>• Timing is based on <strong>Blocks</strong>, not seconds. Bitcoin produces a block roughly every 10 minutes.</li>
              <li>• To "reset" the timer, you simply move your funds to a new vault.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
            <AlertTriangle className="w-4 h-4" /> Critical Safety Checklist
          </div>
          <div className="glass p-6 space-y-4 border-yellow-500/20 bg-yellow-500/5">
            <h4 className="font-bold text-yellow-500">What you MUST keep safe:</h4>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li>1. <strong>Your Private Key:</strong> Without your key, you can't "reset" the timer.</li>
              <li>2. <strong>The Recovery Kit:</strong> Your heir needs the JSON file (the "Kit") AND their own private key to claim the funds.</li>
              <li>3. <strong>Heir's Key:</strong> Ensure your beneficiary understands they need to keep their key safe for years.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="font-bold">Can you recover my funds if I lose my keys?</p>
              <p className="text-sm text-foreground/60">No. We have zero access. If you lose your keys, the math ensures the funds are gone forever.</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold">Does this app send my Bitcoin?</p>
              <p className="text-sm text-foreground/60">No. We only generate the address and the script. You use your own wallet (like Sparrow or Electrum) to send the funds.</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold">Can I change the delay later?</p>
              <p className="text-sm text-foreground/60">Yes, but only by moving the funds to a new vault address with a different delay setting.</p>
            </div>
            <div className="space-y-2 border-t border-white/5 pt-4">
              <p className="font-bold text-primary">How does the beneficiary actually claim?</p>
              <p className="text-sm text-foreground/60 leading-relaxed">
                They use an advanced Bitcoin wallet (like Sparrow Wallet) to provide their signature and the "Witness Script" generated by this app. The network verifies that the required time has passed since the funds were deposited and, if valid, allows the beneficiary to move the funds to their own address.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="pt-12 text-center">
        <button
          type="button"
          onClick={onBack}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold"
        >
          Got it, let's go
        </button>
      </footer>
    </div>
  );
};

export default Learn;
