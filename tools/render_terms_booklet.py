from pathlib import Path
from xml.sax.saxutils import escape
import json
import re
import sys

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parent
if (ROOT/'booklet_data.json').exists():
 DATA_PATH = ROOT/'booklet_data.json'
 ASSET_ROOT = ROOT/'booklet_assets'
 OUTPUT = ROOT/'output/RJL_Warranty_Terms_Booklet_Victoria.pdf'
 LOGO = ASSET_ROOT/'RJL Commercial transparent logo.png'
 FONT_PATH = ASSET_ROOT/'ZingSansRustPrint.ttf'
else:
 ROOT = ROOT.parent
 DATA_PATH = ROOT/'docs/terms-and-warranty-victoria.json'
 ASSET_ROOT = ROOT/'docs/assets'
 OUTPUT = ROOT/'site/downloads/RJL_Warranty_Terms_Booklet_Victoria.pdf'
 LOGO = ASSET_ROOT/'rjl-commercial-logo.png'
 FONT_PATH = ASSET_ROOT/'ZingSansRustPrint.ttf'

DATA = json.loads(DATA_PATH.read_text())
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('ZingSansRust', str(FONT_PATH)))
pdfmetrics.registerFontFamily('ZingSansRust', normal='ZingSansRust', bold='ZingSansRust', italic='ZingSansRust', boldItalic='ZingSansRust')

RED = colors.HexColor('#D91E26')
CHARCOAL = colors.HexColor('#141A21')
INK = colors.HexColor('#151A20')
PALE = colors.HexColor('#F1F3F5')
GREY = colors.HexColor('#59636C')
WIDTH, HEIGHT = A4
MARGIN = 39.7
GAP = 18
COL = WIDTH-2*MARGIN
BODY_TOP = HEIGHT-73
BODY_BOTTOM = 42

ST = {
 'body': ParagraphStyle('body', fontName='ZingSansRust', fontSize=8.5, leading=10.2, textColor=INK, spaceAfter=2.8),
 'bullet': ParagraphStyle('bullet', fontName='ZingSansRust', fontSize=8.5, leading=10.2, textColor=INK, spaceAfter=2.2, leftIndent=8, firstLineIndent=-8),
 'h': ParagraphStyle('h', fontName='ZingSansRust', fontSize=11.5, leading=14.1, textColor=RED, spaceBefore=7.5, spaceAfter=4, keepWithNext=True),
 'part': ParagraphStyle('part', fontName='ZingSansRust', fontSize=16.5, leading=19.6, textColor=CHARCOAL, spaceBefore=0, spaceAfter=8, keepWithNext=True),
 'table': ParagraphStyle('table', fontName='ZingSansRust', fontSize=8.5, leading=10.2, textColor=INK),
 'table_head': ParagraphStyle('table_head', fontName='ZingSansRust', fontSize=8.5, leading=10.2, textColor=colors.white),
 'callout': ParagraphStyle('callout', fontName='ZingSansRust', fontSize=9.5, leading=11.8, textColor=INK, spaceAfter=2),
}

def para(s, style='body'):
 return Paragraph(escape(s.replace('|',' / ')), ST[style])

def heading(s, key):
 p=para(s,'h');p.bookmark_key=key;return p

def table_block(rows):
 n=len(rows[0]); widths=[COL/n]*n
 if n==2:
  widths=[COL*.40,COL*.60]
 cells=[[para(c, 'table_head' if i==0 else 'table') for c in row] for i,row in enumerate(rows)]
 table=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
 table.setStyle(TableStyle([
  ('BACKGROUND',(0,0),(-1,0),CHARCOAL),
  ('VALIGN',(0,0),(-1,-1),'TOP'),
  ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),
  ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
  ('LINEBELOW',(0,0),(-1,0),1,RED),
  ('ROWBACKGROUNDS',(0,1),(-1,-1),[PALE,colors.white]),
  ('LINEBELOW',(0,1),(-1,-1),.25,colors.HexColor('#D9DEE3')),
 ]))
 return table

def blocks_for(section, prefix):
 elements=[heading(f'{section["number"]}  {section["title"]}',prefix+section['id'])]
 for block in section['blocks']:
  if block['type']=='table':
   elements += [Spacer(1,2), table_block(block['rows']), Spacer(1,5)]
  elif block['type']=='bullet':
   elements.append(para('- '+block['text'],'bullet'))
  else:
   elements.append(para(block['text']))
 return elements

def draw_header(canvas, doc):
 canvas.saveState()
 canvas.setFillColor(CHARCOAL)
 canvas.rect(0,HEIGHT-6,WIDTH,6,fill=1,stroke=0)
 canvas.drawImage(str(LOGO),MARGIN,HEIGHT-61,width=132,height=46,preserveAspectRatio=True,mask='auto',anchor='c')
 canvas.setFont('ZingSansRust',9.5)
 canvas.setFillColor(INK)
 canvas.drawRightString(WIDTH-MARGIN,HEIGHT-34,'WARRANTY AND TERMS')
 canvas.setFillColor(GREY)
 canvas.drawRightString(WIDTH-MARGIN,HEIGHT-47,'Victorian installations / Version '+DATA['version'])
 canvas.setStrokeColor(colors.HexColor('#DCE1E5'))
 canvas.setLineWidth(.5)
 canvas.line(MARGIN,HEIGHT-64,WIDTH-MARGIN,HEIGHT-64)
 canvas.setFillColor(GREY)
 canvas.setFont('ZingSansRust',8)
 canvas.drawString(MARGIN,25,DATA['document_code'])
 canvas.drawRightString(WIDTH-MARGIN,25,str(doc.page))
 canvas.restoreState()

def cover(canvas, doc):
 canvas.saveState()
 canvas.setFillColor(colors.white);canvas.rect(0,0,WIDTH,HEIGHT,fill=1,stroke=0)
 canvas.setFillColor(RED);canvas.rect(0,HEIGHT-9,WIDTH,9,fill=1,stroke=0)
 canvas.drawImage(str(LOGO),MARGIN,HEIGHT-142,width=WIDTH-2*MARGIN,height=132,preserveAspectRatio=True,mask='auto')
 canvas.setFillColor(CHARCOAL);canvas.rect(0,HEIGHT-347,WIDTH,197,fill=1,stroke=0)
 canvas.setFillColor(RED);canvas.rect(MARGIN,HEIGHT-186,30,5,fill=1,stroke=0)
 canvas.setFont('ZingSansRust',31);canvas.setFillColor(colors.white)
 canvas.drawString(MARGIN,HEIGHT-231,'WARRANTY AND')
 canvas.drawString(MARGIN,HEIGHT-270,'TERMS BOOKLET')
 canvas.setFont('ZingSansRust',11.5)
 canvas.drawString(MARGIN,HEIGHT-302,'Fencing gates and powdercoating care')
 canvas.drawString(MARGIN,HEIGHT-320,'For Victorian installations')
 # A precise abstract picket motif rather than an unverified project photograph.
 canvas.setStrokeColor(colors.HexColor('#333D48'));canvas.setLineWidth(2)
 for x in range(376,577,13):canvas.line(x,HEIGHT-341,x,HEIGHT-168)
 canvas.setStrokeColor(RED);canvas.line(375,HEIGHT-192,575,HEIGHT-192)
 canvas.setFillColor(INK);canvas.setFont('ZingSansRust',10)
 intro=Paragraph(escape(DATA['introduction']),ParagraphStyle('coverintro',fontName='ZingSansRust',fontSize=10,leading=13.4,textColor=INK))
 iw,ih=intro.wrap(WIDTH-2*MARGIN,200);intro.drawOn(canvas,MARGIN,HEIGHT-370-ih)
 y=HEIGHT-390-ih
 canvas.setFont('ZingSansRust',12);canvas.setFillColor(RED);canvas.drawString(MARGIN,y,'INSIDE THIS BOOKLET')
 y-=25
 entries=[('Part 1  Warranty terms and conditions','part1'),('Care and maintenance requirements','w-w2'),('Part 2  Sale and installation terms','part2'),('Acceptance and maintenance record','acceptance')]
 for label,key in entries:
  num=doc.known_pages.get(key,'')
  canvas.setFillColor(INK);canvas.setFont('ZingSansRust',10)
  canvas.drawString(MARGIN,y,label)
  if num:canvas.drawRightString(WIDTH-MARGIN,y,str(num))
  canvas.linkRect('',key,(MARGIN,y-3,WIDTH-MARGIN,y+12),relative=0,thickness=0)
  y-=23
 canvas.setFillColor(PALE);canvas.roundRect(MARGIN,77,WIDTH-2*MARGIN,118,7,fill=1,stroke=0)
 canvas.setFont('ZingSansRust',9.5);canvas.setFillColor(INK)
 left=MARGIN+12;by=174
 for c in DATA['companies'].values():
  canvas.drawString(left,by,c['name']);by-=13
  canvas.drawString(left,by,'ABN '+c['abn']+' / '+c['phone']+' / '+c['email']);by-=13
  canvas.drawString(left,by,c['address']);by-=22
 canvas.setFont('ZingSansRust',8);canvas.setFillColor(GREY)
 canvas.drawString(MARGIN,47,'Issued '+DATA['issue_date']+' / Version '+DATA['version'])
 canvas.drawRightString(WIDTH-MARGIN,47,DATA['document_code'])
 canvas.restoreState()

class BookletDoc(BaseDocTemplate):
 def __init__(self,path,known_pages=None):
  super().__init__(str(path),pagesize=A4,leftMargin=MARGIN,rightMargin=MARGIN,topMargin=73,bottomMargin=BODY_BOTTOM,title=DATA['title'],author='RJL Commercial Fencing and Gates (VIC) Pty Ltd / RJL FENCING PTY. LTD.',subject=DATA['subtitle'])
  self.known_pages=known_pages or {};self.found_pages={}
  cover_frame=Frame(MARGIN,40,WIDTH-2*MARGIN,20,id='cover',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
  frames=[Frame(MARGIN,BODY_BOTTOM,COL,BODY_TOP-BODY_BOTTOM,id='body',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)]
  self.addPageTemplates([PageTemplate(id='Cover',frames=[cover_frame],onPage=cover,autoNextPageTemplate='Content'),PageTemplate(id='Content',frames=frames,onPage=draw_header)])
 def afterFlowable(self,flowable):
  key=getattr(flowable,'bookmark_key',None)
  if key:
   self.canv.bookmarkPage(key)
   self.found_pages[key]=self.page
   if key in ('part1','part2','acceptance'):
    self.canv.addOutlineEntry(flowable.getPlainText(),key,level=0,closed=False)

def story():
 flows=[Spacer(1,1),PageBreak()]
 p=para('Part 1 Warranty terms and conditions','part');p.bookmark_key='part1';flows.append(p)
 flows.append(para('Company means the legal entity named in the accepted quotation. Client means the customer entering that contract. This booklet applies to the work and products stated in the quotation.'))
 flows.append(para(DATA['contract_notice']))
 for section in DATA['warranty']:
  part=blocks_for(section,'w-')
  if section['id']=='w14':flows.append(KeepTogether(part))
  else:flows.extend(part)
 flows.append(Spacer(1,10))
 p=para('Part 2 Sale and installation terms','part');p.bookmark_key='part2';flows.append(p)
 flows.append(para('These terms apply to the Company and Client identified in the quotation, subject to the project contract and mandatory law. They cover quotation, supply, installation and associated services.'))
 for section in DATA['sales']:flows.extend(blocks_for(section,'s-'))
 p=heading('Acceptance','acceptance');flows.append(p);flows.append(para(DATA['acceptance']))
 flows.append(heading('Maintenance record','record'))
 flows.append(para('Record washing, inspections, motor servicing, products used and repairs. Keep photos or supporting records where available. Extra copies of this record may be used.'))
 rows=[['Date','Work or service and product used','Notes or photo reference']]+[['','',''] for _ in range(3)]
 cells=[[para(v,'table_head' if i==0 else 'table') for v in row] for i,row in enumerate(rows)]
 tab=Table(cells,colWidths=[COL*.18,COL*.43,COL*.39],rowHeights=[None]+[23]*3,repeatRows=1,hAlign='LEFT')
 tab.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),CHARCOAL),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#CFD5DB')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
 flows += [tab,Spacer(1,7),para('Claims and service contacts appear on the front cover. The full terms and care references are available through the Terms and Conditions footer link on each RJL website.')]
 return flows

def main():
 interim=OUTPUT.parent/'booklet-layout-pass.pdf'
 first=BookletDoc(interim);first.build(story())
 final=BookletDoc(OUTPUT,first.found_pages);final.build(story())
 from pypdf import PdfReader
 pages=len(PdfReader(OUTPUT).pages)
 metadata={'pdf':str(OUTPUT),'pages':pages,'section_pages':final.found_pages,'body_font_points':8.5,'font':'Zing Sans Rust Light Demo Base','version':DATA['version']}
 (OUTPUT.parent/'booklet-layout.json').write_text(json.dumps(metadata,indent=2))
 interim.unlink(missing_ok=True)
 print(json.dumps(metadata))

if __name__=='__main__':main()
