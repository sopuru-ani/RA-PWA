import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  DoorOpen,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
  Shield,
  Clock,
  Smartphone,
} from "lucide-react";

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        strokeWidth="2.0282"
        d="m 218.47518,869.74634 c 0.0233,-0.84349 -0.20246,-64.5886 -0.50165,-141.65568 l -0.54398,-140.122 -40.63411,-0.91829 c -22.34876,-0.50504 -40.63411,-1.5924 -40.63411,-2.4163 0,-0.82394 54.91663,-56.98052 122.03697,-124.79235 l 122.03697,-123.29433 66.71281,-0.61719 66.71282,-0.61717 9.31149,-12.37694 c 74.36398,-98.84537 136.71807,-179.9881 138.30086,-179.97391 2.59302,0.0232 34.73586,21.2326 34.73586,22.92033 0,1.0335 -7.61175,11.71902 -16.91498,23.74564 -40.58147,52.46106 -109.44398,143.90353 -109.47182,145.36764 -0.0159,0.88047 10.10469,1.43153 22.49207,1.22456 l 22.52252,-0.37632 26.70983,-37.60221 c 14.69043,-20.68124 38.97142,-55.21143 53.95774,-76.73375 14.98634,-21.52233 28.01598,-39.12462 28.95477,-39.11621 2.44228,0.0219 31.62102,18.54365 33.11416,21.01984 1.58314,2.62541 -6.81165,15.30208 -59.06761,89.19593 l -42.39763,59.95336 29.58195,30.47567 29.58192,30.47569 0.55716,-28.73113 0.55715,-28.73111 21.5157,0.77304 21.51566,0.77301 0.53719,50.84426 0.53717,50.84426 63.24914,66.32181 63.24916,66.32177 -40.71015,0.65752 -40.71017,0.65754 -0.26596,141.13747 -0.26597,141.13742 -38.36152,0.21141 -38.36153,0.21141 v -22.54474 -22.5447 l 17.0563,0.15292 17.0563,0.15314 V 690.11986 549.08209 l 10.77956,-0.51675 10.77958,-0.51676 -77.10077,-80.38992 c -58.86068,-61.37176 -77.75911,-79.93005 -79.88356,-78.4459 -1.53055,1.06926 -42.29449,46.965 -90.58657,101.99056 l -87.80378,100.04645 -93.92099,-1.44704 -93.92103,-1.44703 7.3e-4,119.15068 7.3e-4,119.1507 114.37751,1.02611 114.37748,1.02615 V 711.06108 593.41283 l 20.39989,-22.79723 c 11.21995,-12.53846 21.15273,-23.09729 22.07286,-23.46401 0.92014,-0.36677 1.67296,73.04804 1.67296,163.144 V 874.1064 L 375.9527,872.69336 C 289.31674,871.9161 218.45182,870.58993 218.47509,869.74634 Z M 451.00465,521.89545 c 11.48019,-13.03047 43.00472,-48.80632 70.05452,-79.50191 27.0498,-30.69561 50.6157,-57.54119 52.36866,-59.65691 3.12307,-3.76929 1.39004,-3.83482 -86.10749,-3.25757 l -89.29474,0.58909 -57.82225,58.21776 c -31.80225,32.01973 -67.79742,68.94385 -79.98927,82.05355 l -22.16699,23.83581 96.04224,0.70599 96.04224,0.70597 z m 152.03094,351.47147 c -0.73577,-0.75672 -1.33775,-41.26305 -1.33775,-90.01425 v -88.63855 l 46.15232,0.41403 46.15233,0.41405 v 90.00224 90.00231 l -44.81461,-0.40218 c -24.64799,-0.22107 -45.41653,-1.02102 -46.15229,-1.77765 z"
      />
    </svg>
  );
}

const features = [
  {
    icon: Users,
    title: "Residents",
    description:
      "View your section's residents, see assignments, and manage resident info efficiently.",
  },
  {
    icon: DoorOpen,
    title: "Vacancies",
    description:
      "Quickly identify unoccupied rooms and plan for new assignments.",
  },
  {
    icon: AlertTriangle,
    title: "Incidents",
    description:
      "Report and track incidents directly in the app — no paper forms required.",
  },
  {
    icon: ClipboardCheck,
    title: "Inspections",
    description:
      "Conduct walkthroughs, track room status, and ensure all housing standards are met.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Save Time",
    description: "Streamline your daily tasks with efficient digital workflows.",
  },
  {
    icon: Shield,
    title: "Stay Organized",
    description: "Keep all your records in one secure, accessible location.",
  },
  {
    icon: Smartphone,
    title: "Access Anywhere",
    description: "Works on any device — desktop, tablet, or mobile.",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="text-center space-y-8">
            {/* Logo + Title */}
            <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-foreground/10 bg-background/50 backdrop-blur-sm p-2 shadow-lg">
                <Logo className="w-full h-full text-foreground" />
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Domus
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              Residential life, organized. Inspections, walkthroughs, and
              records — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Button asChild size="lg" className="text-base px-8 h-12">
                <Link href="/login">
                  Log in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base px-8 h-12"
              >
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful tools designed specifically for Resident Assistants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-card rounded-2xl border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Built for the way you work
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Stop juggling spreadsheets and paper forms. Domus brings
                everything together so you can focus on what matters — your
                residents.
              </p>
              <div className="space-y-6">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <benefit.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual placeholder */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/10 flex items-center justify-center">
                <Logo className="w-1/3 h-1/3 text-primary/40" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join your housing team on Domus and streamline your workflow today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8 h-12">
              <Link href="/login">
                Log in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base px-8 h-12"
            >
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Accounts are enabled by housing administrators.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Domus
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Resident Assistants
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
