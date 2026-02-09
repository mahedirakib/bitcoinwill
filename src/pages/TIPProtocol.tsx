import { ChevronLeft, Clock, HelpCircle, Shield, CheckCircle, XCircle, Lock, AlertTriangle, FileCode } from 'lucide-react';

const TIPProtocol = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-16 animate-in fade-in slide-in-from-bottom-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to App
      </button>

      <header className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">TIP Protocol</h1>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">What is TIP?</h2>
        </div>
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p> TIP stands for TimeLock Inheritance Protocol. It is a Bitcoin-native way to plan inheritance using Bitcoin timelocks and spending conditions.</p>
          <p>TIP is not a new blockchain. It is not a token. It is not a company or custody service.</p>
          <p>TIP is a practical pattern for creating a future spending plan that can only be executed after a chosen time, using Bitcoin's existing script capabilities.</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Why TIP exists</h2>
        </div>
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>Bitcoin is unforgiving. If a person dies or becomes unable to access their keys, Bitcoin can be lost forever.</p>
          <p>Most inheritance solutions try to solve this by adding a trusted third party, such as a custodian, an account system, or a company that holds secrets. That introduces new risks.</p>
          <p>TIP exists to provide a trust-minimized option: a way to plan ahead while keeping control in the hands of the Bitcoin owner.</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">How TIP works (high level)</h2>
        </div>
        <div className="space-y-6">
          <p className="text-foreground/70 leading-relaxed">
            TIP uses timelocks to create a spending path that is not valid until a specific date or block height.
          </p>
          <p className="text-foreground/70 leading-relaxed">
            A simple way to think about it:
          </p>
          
          <div className="glass p-8 space-y-0">
            {[
              {
                num: '1',
                title: 'You choose a timeline and beneficiaries or a recovery plan.',
              },
              {
                num: '2',
                title: 'Bitcoin Will generates a TIP spending plan and script conditions.',
              },
              {
                num: '3',
                title: 'Funds are arranged so they can only be moved according to that plan.',
              },
              {
                num: '4',
                title: 'Before the timelock expires, the future-spend path is not valid.',
              },
              {
                num: '5',
                title: 'After the timelock expires, the future-spend path becomes valid and can be used.',
              },
            ].map((step, i, arr) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{step.num}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-px h-full bg-border my-2" />
                  )}
                </div>
                <div className="pb-8 flex-1">
                  <p className="text-foreground/80 leading-relaxed">{step.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass p-6 border-l-4 border-l-primary">
            <p className="text-foreground/70 leading-relaxed">
              All rules are enforced by the Bitcoin network itself. Bitcoin Will is not trusted.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">What Bitcoin Will does</h2>
        </div>
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>Bitcoin Will is a tool that helps you build a TIP plan safely and clearly.</p>
          <p className="font-semibold text-foreground/90">Bitcoin Will:</p>
          <ul className="space-y-2">
            {[
              'Generates TIP-compatible Bitcoin scripts and a readable spending plan',
              'Helps users choose time parameters and understand tradeoffs',
              'Runs locally in the browser',
              'Does not require an account',
              'Does not store user data',
              'Does not see private keys',
              'Does not broadcast transactions automatically',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold">What Bitcoin Will does NOT do</h2>
        </div>
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>Bitcoin Will is intentionally minimal and non-custodial.</p>
          <p className="font-semibold text-foreground/90">Bitcoin Will is not:</p>
          <ul className="space-y-2">
            {[
              'A wallet',
              'A custodian',
              'A legal will',
              'A monitoring service that checks whether someone is alive',
              'A guarantee against user error',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="pt-2">Users remain fully responsible for how the tool is used.</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Security model</h2>
        </div>
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>Bitcoin Will is designed to minimize trust and data exposure.</p>
          
          <div className="font-semibold text-foreground/90">Core properties:</div>
          <ul className="space-y-2">
            {[
              'Stateless, with no stored user plans',
              'Client-side only',
              'Outputs are inspectable and verifiable',
              'Open-source and reviewable',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="font-semibold text-foreground/90 pt-2">Strong recommendations:</div>
          <ul className="space-y-2">
            {[
              'Test with small amounts',
              'Use Bitcoin Testnet before Mainnet',
              'Have a knowledgeable third party review your plan if unsure',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold">Status & disclaimer</h2>
        </div>
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>TIP and Bitcoin Will are early and experimental.</p>
          <p>Always verify generated outputs. Test before relying on them. If legal certainty is required, consult a qualified professional.</p>
          <p>Bitcoin Will is an educational and practical tool. Responsibility remains with the user.</p>
        </div>
      </section>

      <footer className="pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-foreground/50">
          <p>TimeLock Inheritance Protocol (TIP)</p>
          <a 
            href="https://github.com/mahedirakib/bitcoinwill/blob/main/whitepaper.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <FileCode className="w-4 h-4" /> View Whitepaper
          </a>
        </div>
      </footer>
    </div>
  );
};

export default TIPProtocol;
