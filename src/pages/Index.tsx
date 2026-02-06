import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
    const navigate = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        const user = localStorage.getItem("allboom_user");
        if (user) {
            navigate("/dashboard");
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
            {/* Decorative Blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blob blob-animate -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 blob blob-animate translate-x-1/4 translate-y-1/4" />
                <div className="absolute top-1/2 right-0 w-64 h-64 bg-accent/10 blob blob-animate translate-x-1/2" />
            </div>

            <Card className="relative z-10 w-full max-w-md card-playful">
                <CardContent className="p-8 text-center">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-pink flex items-center justify-center shadow-glow">
                            <Palette className="w-10 h-10 text-primary-foreground" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-display font-bold mb-2">
                        <span className="text-gradient">Allboom</span>
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Platform E-Portfolio Seni untuk mengelola tugas, karya,
                        dan penilaian seni digital.
                    </p>

                    {/* Login Button */}
                    <Button
                        variant="gradient"
                        size="xl"
                        className="w-full gap-2 mb-4"
                        onClick={() => navigate("/auth")}
                    >
                        <Sparkles className="w-5 h-5" />
                        Masuk ke Aplikasi
                    </Button>

                    {/* Info */}
                    <p className="text-xs text-muted-foreground">
                        Platform khusus untuk guru dan siswa seni
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default Index;
