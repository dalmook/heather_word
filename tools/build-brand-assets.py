"""Rebuild static brand PNGs from the existing SVG. Not needed to run the app.
Build dependencies: Pillow 11.3.0, CairoSVG 2.8.2; system Noto CJK font (not distributed).
"""
from pathlib import Path
import cairosvg
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parents[1]/'assets/icons'
for size,name in [(192,'app-192.png'),(512,'app-512.png'),(180,'apple-touch-icon.png')]:
    cairosvg.svg2png(url=str(p/'app-icon.svg'),write_to=str(p/name),output_width=size,output_height=size)
im=Image.new('RGB',(1200,630),'#f7f8fa');d=ImageDraw.Draw(im)
f='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
d.rounded_rectangle((80,100,190,210),24,fill='#5b43c4')
d.text((106,107),'h.',font=ImageFont.truetype(f,62),fill='white')
d.text((80,240),'Heather Word',font=ImageFont.truetype(f,70),fill='#202537')
d.text((80,350),'매일 자라는 영어 자신감',font=ImageFont.truetype(f,44),fill='#5b43c4')
d.text((84,438),'카드 학습 · 철자 게임 · 나만의 모험',font=ImageFont.truetype(f,28),fill='#5a6475')
im.save(p/'social-card.png',optimize=True)
