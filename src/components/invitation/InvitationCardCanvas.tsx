import { useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationCardCanvasProps {
  coupleName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  personalNote: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const CARD_W = 1080;
const CARD_H = 1920;

const InvitationCardCanvas = ({
  coupleName,
  eventDate,
  eventTime,
  venue,
  personalNote,
}: InvitationCardCanvasProps) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    bgGrad.addColorStop(0, '#FFF8F0');
    bgGrad.addColorStop(0.5, '#FFFFFF');
    bgGrad.addColorStop(1, '#FFF0E6');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Decorative border
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, CARD_W - 80, CARD_H - 80);
    ctx.strokeStyle = '#E8C9A0';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, CARD_W - 110, CARD_H - 110);

    // Corner ornaments
    drawCornerOrnaments(ctx);

    // Top decorative hearts
    const heartY = 200;
    ctx.fillStyle = '#D4A574';
    drawHeart(ctx, CARD_W / 2 - 60, heartY, 30);
    drawHeart(ctx, CARD_W / 2, heartY - 10, 40);
    drawHeart(ctx, CARD_W / 2 + 60, heartY, 30);

    // "You are invited" text
    ctx.fillStyle = '#B8860B';
    ctx.font = '300 36px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦  ' + t('youAreInvited').toUpperCase() + '  ✦', CARD_W / 2, 340);

    // Decorative line
    drawDecorativeLine(ctx, CARD_W / 2, 380, 300);

    // "To the wedding of"
    ctx.fillStyle = '#8B7355';
    ctx.font = 'italic 32px "Playfair Display", Georgia, serif';
    ctx.fillText(t('joinUs'), CARD_W / 2, 440);

    // Couple name
    ctx.fillStyle = '#4A3728';
    ctx.font = 'bold 72px "Playfair Display", Georgia, serif';
    const nameLines = wrapText(ctx, coupleName, CARD_W - 160, 72);
    let nameY = 560;
    nameLines.forEach(line => {
      ctx.fillText(line, CARD_W / 2, nameY);
      nameY += 85;
    });

    // Decorative line below name
    drawDecorativeLine(ctx, CARD_W / 2, nameY + 20, 400);

    // Ampersand ornament
    ctx.fillStyle = '#D4A574';
    ctx.font = '48px "Playfair Display", Georgia, serif';

    // Event details section
    const detailsY = nameY + 100;

    // Date
    ctx.fillStyle = '#4A3728';
    ctx.font = '28px "Playfair Display", Georgia, serif';
    ctx.fillText('📅  ' + t('eventDate'), CARD_W / 2, detailsY);
    ctx.font = 'bold 44px "Playfair Display", Georgia, serif';
    const formattedDate = formatDate(eventDate);
    ctx.fillText(formattedDate, CARD_W / 2, detailsY + 55);

    // Time
    if (eventTime) {
      ctx.font = '28px "Playfair Display", Georgia, serif';
      ctx.fillText('🕐  ' + t('eventTime'), CARD_W / 2, detailsY + 130);
      ctx.font = 'bold 44px "Playfair Display", Georgia, serif';
      ctx.fillText(eventTime, CARD_W / 2, detailsY + 185);
    }

    // Venue
    const venueY = eventTime ? detailsY + 260 : detailsY + 130;
    ctx.font = '28px "Playfair Display", Georgia, serif';
    ctx.fillText('📍  ' + t('eventVenue'), CARD_W / 2, venueY);
    ctx.font = 'bold 40px "Playfair Display", Georgia, serif';
    const venueLines = wrapText(ctx, venue, CARD_W - 200, 40);
    let vy = venueY + 55;
    venueLines.forEach(line => {
      ctx.fillText(line, CARD_W / 2, vy);
      vy += 50;
    });

    // Personal note
    if (personalNote) {
      const noteY = vy + 60;
      drawDecorativeLine(ctx, CARD_W / 2, noteY - 20, 200);
      ctx.fillStyle = '#8B7355';
      ctx.font = 'italic 30px "Playfair Display", Georgia, serif';
      const noteLines = wrapText(ctx, '💌 ' + personalNote, CARD_W - 200, 30);
      let ny = noteY + 20;
      noteLines.forEach(line => {
        ctx.fillText(line, CARD_W / 2, ny);
        ny += 40;
      });
    }

    // Bottom section
    const bottomY = CARD_H - 280;
    drawDecorativeLine(ctx, CARD_W / 2, bottomY, 300);

    ctx.fillStyle = '#8B7355';
    ctx.font = 'italic 28px "Playfair Display", Georgia, serif';
    ctx.fillText(t('rsvpMessage'), CARD_W / 2, bottomY + 50);

    // "With love" + hearts
    ctx.fillStyle = '#D4A574';
    ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
    ctx.fillText(t('withLove') + ' ❤️', CARD_W / 2, bottomY + 110);

    // Couple name at bottom
    ctx.fillStyle = '#4A3728';
    ctx.font = '40px "Playfair Display", Georgia, serif';
    ctx.fillText(coupleName, CARD_W / 2, bottomY + 170);

    // Bottom ornaments
    ctx.fillStyle = '#D4A574';
    drawHeart(ctx, CARD_W / 2 - 40, CARD_H - 80, 20);
    drawHeart(ctx, CARD_W / 2, CARD_H - 85, 25);
    drawHeart(ctx, CARD_W / 2 + 40, CARD_H - 80, 20);
  }, [coupleName, eventDate, eventTime, venue, personalNote, t]);

  useEffect(() => {
    drawCard();
  }, [drawCard]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `invitation-${coupleName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success(t('downloadStarted'));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border-2 border-primary/20 shadow-lg">
        <canvas
          ref={canvasRef}
          width={CARD_W}
          height={CARD_H}
          className="w-full h-auto"
        />
      </div>
      <button
        onClick={handleDownload}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-gradient py-3 text-sm font-semibold text-primary-foreground"
      >
        <Download className="h-4 w-4" />
        {t('downloadCard')}
      </button>
    </div>
  );
};

// --- helpers ---

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
  ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
  ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
  ctx.fill();
}

function drawDecorativeLine(ctx: CanvasRenderingContext2D, cx: number, y: number, width: number) {
  const grad = ctx.createLinearGradient(cx - width / 2, y, cx + width / 2, y);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.3, '#D4A574');
  grad.addColorStop(0.5, '#B8860B');
  grad.addColorStop(0.7, '#D4A574');
  grad.addColorStop(1, 'transparent');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, y);
  ctx.lineTo(cx + width / 2, y);
  ctx.stroke();
}

function drawCornerOrnaments(ctx: CanvasRenderingContext2D) {
  const s = 60;
  ctx.strokeStyle = '#D4A574';
  ctx.lineWidth = 3;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(70, 70 + s);
  ctx.quadraticCurveTo(70, 70, 70 + s, 70);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(CARD_W - 70 - s, 70);
  ctx.quadraticCurveTo(CARD_W - 70, 70, CARD_W - 70, 70 + s);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(70, CARD_H - 70 - s);
  ctx.quadraticCurveTo(70, CARD_H - 70, 70 + s, CARD_H - 70);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(CARD_W - 70 - s, CARD_H - 70);
  ctx.quadraticCurveTo(CARD_W - 70, CARD_H - 70, CARD_W - 70, CARD_H - 70 - s);
  ctx.stroke();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, _fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default InvitationCardCanvas;
