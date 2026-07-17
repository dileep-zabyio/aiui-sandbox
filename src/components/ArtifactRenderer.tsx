/**
 * ArtifactRenderer — renders parsed ContentBlock[] as AIUI React components.
 *
 * Text blocks are rendered as simple paragraphs (with basic markdown-like styling).
 * Artifact blocks are mapped to the corresponding AIUI primitive component by type.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

import {
  Chart,
  Spreadsheet,
  Image,
  Gallery,
  Map,
} from '@zaby-ai/aiui-react';

// Mock implementations for components missing in published @zaby-ai/aiui-react@0.1.2
const Table = ({ columns, rows }: any) => (
  <div className="overflow-x-auto border border-border/80 rounded-xl bg-card">
    <table className="min-w-full text-xs text-left">
      <thead>
        <tr className="border-b border-border bg-muted/30">
          {columns?.map((col: any) => (
            <th key={col.key} className="px-4 py-2 font-semibold text-muted-foreground">{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows?.map((row: any, idx: number) => (
          <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
            {columns?.map((col: any) => (
              <td key={col.key} className="px-4 py-2 text-foreground font-mono">{String(row[col.key] ?? '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CodeBlock = ({ code, filename, caption }: any) => (
  <div className="border border-border/80 rounded-xl bg-muted/10 text-left overflow-hidden">
    {filename && <div className="px-4 py-2 border-b border-border bg-muted/20 text-xs font-mono text-muted-foreground">{filename}</div>}
    <pre className="p-4 overflow-x-auto font-mono text-xs text-foreground whitespace-pre"><code>{code}</code></pre>
    {caption && <div className="px-4 py-2 border-t border-border bg-muted/5 text-[10px] text-muted-foreground">{caption}</div>}
  </div>
);

const MetricsCard = ({ title, value }: any) => (
  <div className="p-4 bg-card border border-border/80 rounded-xl text-left">
    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{title}</div>
    <div className="text-lg font-bold text-foreground mt-1">{value}</div>
  </div>
);

const Timeline = ({ items }: any) => (
  <div className="space-y-4 text-left p-2 border border-border/50 rounded-xl bg-muted/5">
    {items?.map((item: any, idx: number) => (
      <div key={idx} className="relative pl-6 border-l border-border last:border-transparent">
        <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary" />
        <div className="text-xs font-semibold text-foreground">{item.title}</div>
        {item.timestamp && <span className="text-[9px] text-muted-foreground">{item.timestamp}</span>}
        {item.description && <p className="text-[11px] text-muted-foreground mt-1">{item.description}</p>}
      </div>
    ))}
  </div>
);

const Card = ({ title, subtitle, description }: any) => (
  <div className="p-5 bg-card border border-border/80 rounded-xl text-left shadow-sm">
    <h3 className="text-xs font-bold text-foreground">{title}</h3>
    {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
    {description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{description}</p>}
  </div>
);

const JSONViewer = ({ data }: any) => (
  <pre className="font-mono text-[10px] bg-muted/30 p-4 border border-border/50 rounded-lg overflow-x-auto text-muted-foreground text-left whitespace-pre">
    {JSON.stringify(data, null, 2)}
  </pre>
);

const FlowDiagram = (_props: any) => <div className="p-4 border rounded-xl bg-muted/10 text-xs text-muted-foreground select-none">Flow Diagram Display</div>;
const SequenceDiagram = (_props: any) => <div className="p-4 border rounded-xl bg-muted/10 text-xs text-muted-foreground select-none">Sequence Diagram Display</div>;

const Accordion = ({ items }: any) => (
  <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/50 text-left">
    {items?.map((item: any, idx: number) => (
      <details key={idx} className="group bg-card">
        <summary className="flex items-center justify-between px-4 py-2 text-xs font-semibold cursor-pointer select-none hover:bg-muted/10">
          <span>{item.title}</span>
          <span className="transition-transform group-open:rotate-180">▼</span>
        </summary>
        <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border/30 bg-muted/5 leading-relaxed">
          {item.content}
        </div>
      </details>
    ))}
  </div>
);

const Tabs = ({ items }: any) => (
  <div className="border border-border/80 rounded-xl overflow-hidden bg-card text-left">
    <div className="flex border-b border-border bg-muted/30">
      {items?.map((item: any, idx: number) => (
        <div key={idx} className="px-4 py-2 text-xs font-semibold border-r border-border hover:bg-muted/10 cursor-pointer">
          {item.title || item.label}
        </div>
      ))}
    </div>
    <div className="p-4 text-xs text-muted-foreground min-h-[50px]">
      {items?.[0]?.content || 'Select a tab to view content'}
    </div>
  </div>
);

const Alert = ({ children }: any) => (
  <div className="p-4 border rounded-xl bg-destructive/10 border-destructive/20 text-destructive text-xs leading-relaxed text-left flex gap-2">
    <span>⚠️</span>
    <div>{children}</div>
  </div>
);

const Progress = ({ value, max }: any) => (
  <div className="w-full bg-muted border border-border/50 rounded-full h-2.5 overflow-hidden">
    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(value / (max || 100)) * 100}%` }} />
  </div>
);

const Calendar = ({ events }: any) => (
  <div className="p-4 bg-card/45 border border-border/80 rounded-xl text-left">
    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Calendar</div>
    <div className="space-y-1">
      {events?.map((evt: any) => (
        <div key={evt.id} className="p-2 rounded bg-muted/30 border border-border/40 text-xs">
          {evt.title} ({evt.start})
        </div>
      ))}
    </div>
  </div>
);

const Tree = (_props: any) => null;
const Artifact = ({ children }: any) => <div>{children}</div>;
const Badge = ({ children }: any) => (
  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted border border-border/60 text-muted-foreground select-none">
    {children}
  </span>
);
const Graph = (_props: any) => null;
const Canvas = (_props: any) => null;
const Video = ({ src, caption }: any) => (
  <div className="border border-border/85 rounded-xl overflow-hidden bg-black max-w-md mx-auto">
    <video src={src} controls className="w-full" />
    {caption && <div className="p-2 text-[10px] text-muted-foreground bg-card text-left">{caption}</div>}
  </div>
);
const Audio = ({ src, caption }: any) => (
  <div className="border border-border/85 rounded-xl p-4 bg-card max-w-sm mx-auto">
    <audio src={src} controls className="w-full" />
    {caption && <div className="mt-2 text-[10px] text-muted-foreground text-left">{caption}</div>}
  </div>
);
const File = ({ name, size }: any) => (
  <div className="flex items-center gap-3 p-3 border border-border/80 rounded-xl bg-card text-left max-w-xs">
    <span className="text-xl">📄</span>
    <div className="min-w-0">
      <div className="text-xs font-bold truncate text-foreground">{name}</div>
      {size && <div className="text-[9px] text-muted-foreground">{size} bytes</div>}
    </div>
  </div>
);
const PDFViewer = ({ url }: any) => (
  <div className="border border-border/80 rounded-xl overflow-hidden bg-white h-96">
    <iframe src={url} className="w-full h-full border-0" />
  </div>
);
const Form = ({ children }: any) => <form className="space-y-4">{children}</form>;
const Input = ({ label, placeholder, ...props }: any) => (
  <div className="text-left space-y-1">
    {label && <label className="text-[10px] font-bold text-muted-foreground uppercase">{label}</label>}
    <input placeholder={placeholder} className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none" {...props} />
  </div>
);
const MermaidDiagram = ({ code }: any) => (
  <pre className="font-mono text-[9px] bg-muted/30 p-4 border border-border/50 rounded-lg overflow-x-auto text-muted-foreground text-left whitespace-pre">
    <code>{code}</code>
  </pre>
);
const HTMLEmbed = (_props: any) => null;
const Iframe = ({ src, title }: any) => (
  <div className="border border-border/80 rounded-xl overflow-hidden bg-white h-96">
    <iframe src={src} title={title} className="w-full h-full border-0" />
  </div>
);
const LinkedInputChart = (_props: any) => null;
const ConversationOutline = (_props: any) => null;
import type { ContentBlock, ArtifactBlock } from '../services/artifactParser';

interface ArtifactRendererProps {
  blocks: ContentBlock[];
}

// ---------------------------------------------------------------------------
// Error Boundary to prevent malformed LLM outputs from crashing the app
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ArtifactErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Artifact rendering crash:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Data Mappers / Normalizers
// ---------------------------------------------------------------------------

/**
 * Converts columns/rows of DataGrid to cells representation of Spreadsheet
 */
function convertDataGridToSpreadsheet(columns: any[], rows: any[]): any[] {
  const cells: Record<string, { value: any }> = {};
  
  // Header row: A1, B1, C1...
  columns.forEach((col, colIdx) => {
    const colLetter = String.fromCharCode(65 + colIdx); // A, B, C...
    cells[`${colLetter}1`] = { value: col.label || col.key || '' };
  });

  // Value rows: A2, B2, C2...
  rows.forEach((row, rowIdx) => {
    columns.forEach((col, colIdx) => {
      const colLetter = String.fromCharCode(65 + colIdx);
      const rowNum = rowIdx + 2;
      cells[`${colLetter}${rowNum}`] = { value: row[col.key] ?? '' };
    });
  });

  return [
    {
      name: 'Grid Data',
      cells,
    }
  ];
}

/**
 * Converts items array of List to columns/rows representation of Table
 */
function convertListToTable(items: any[]): { columns: any[]; rows: any[] } {
  const hasIcons = items.some(item => !!item.icon);
  const hasSubtitles = items.some(item => !!item.subtitle);
  const hasValues = items.some(item => !!item.value);

  const columns: any[] = [];
  if (hasIcons) columns.push({ key: 'icon', label: '' });
  columns.push({ key: 'title', label: 'Item' });
  if (hasSubtitles) columns.push({ key: 'subtitle', label: 'Description' });
  if (hasValues) columns.push({ key: 'value', label: 'Value' });

  const rows = items.map(item => ({
    icon: item.icon ?? '',
    title: item.title ?? '',
    subtitle: item.subtitle ?? '',
    value: item.value ?? '',
  }));

  return { columns, rows };
}

/**
 * Render a single artifact block by mapping its type to the correct AIUI component.
 */
function RenderArtifact({ block }: { block: ArtifactBlock }) {
  const { artifactType, title, props } = block;

  switch (artifactType) {
    case 'table':
      return (
        <Table
          columns={(props.columns as any[]) ?? []}
          rows={(props.rows as any[]) ?? []}
          pagination={props.pagination as boolean}
          sorting={props.sorting as boolean}
          searchable={props.searchable as boolean}
        />
      );

    case 'code':
      return (
        <CodeBlock
          code={(props.code as string) ?? ''}
          language={props.language as string}
          filename={props.filename as string}
          caption={props.caption as string}
        />
      );

    case 'chart':
      return (
        <Chart
          chartType={(props.chartType as any) ?? 'line'}
          title={title}
          series={(props.series as any[]) ?? []}
          axes={props.axes as any}
        />
      );

    case 'metrics':
      return (
        <MetricsCard
          title={(props.title as string) ?? title}
          value={(props.value as string) ?? ''}
          change={props.change as number}
          changeType={(props.changeType as any) ?? 'neutral'}
          icon={props.icon as string}
          trend={props.trend as number[]}
        />
      );

    case 'timeline':
      return <Timeline items={(props.items as any[]) ?? []} />;

    case 'card':
      return (
        <Card
          title={(props.title as string) ?? title}
          subtitle={props.subtitle as string}
          description={props.description as string}
          actions={props.actions as any[]}
        />
      );

    case 'json':
      return (
        <JSONViewer
          data={props.data ?? props}
          expandDepth={(props.expandDepth as number) ?? 2}
        />
      );

    case 'flow_diagram':
      return (
        <FlowDiagram
          nodes={(props.nodes as any[]) ?? []}
          edges={(props.edges as any[]) ?? []}
        />
      );

    case 'sequence_diagram':
      return (
        <SequenceDiagram
          participants={(props.participants as string[]) ?? (props.actors as string[]) ?? []}
          messages={(props.messages as any[]) ?? []}
        />
      );

    case 'accordion':
      return <Accordion items={(props.items as any[]) ?? []} />;

    case 'tabs':
      return <Tabs items={(props.items as any[]) ?? []} />;

    case 'list':
      // Redesign request: list combined into Table format
      const listTable = convertListToTable(props.items as any[] ?? []);
      return (
        <Table
          columns={listTable.columns}
          rows={listTable.rows}
        />
      );

    case 'alert':
      return (
        <Alert
          title={(props.title as string) ?? title}
          description={(props.description as string) ?? ''}
          variant={(props.variant as any) ?? 'info'}
        />
      );

    case 'progress':
      return (
        <Progress
          value={(props.value as number) ?? 0}
          showValue={props.showValue as boolean}
          label={props.label as string}
        />
      );

    case 'spreadsheet':
      return <Spreadsheet sheets={(props.sheets as any[]) ?? []} />;

    case 'calendar':
      return <Calendar events={(props.events as any[]) ?? []} />;

    case 'tree':
      return <Tree nodes={(props.nodes as any[]) ?? []} />;

    case 'badge':
      return (
        <Badge
          label={(props.label as string) ?? title}
          variant={(props.variant as any) ?? 'default'}
        />
      );

    case 'artifact':
      return (
        <Artifact
          id={(props.id as string) ?? `artifact-${Date.now()}`}
          title={(props.title as string) ?? title}
          artifactType={(props.artifactType as string) ?? 'text'}
          content={(props.content as string) ?? ''}
          editable={props.editable as boolean}
          download={props.download as boolean}
          filename={props.filename as string}
        />
      );

    case 'datagrid':
      // Redesign request: replace DataGrid with Spreadsheet
      const gridSheets = convertDataGridToSpreadsheet(props.columns as any[] ?? [], props.rows as any[] ?? []);
      return <Spreadsheet sheets={gridSheets} />;

    case 'graph':
      return (
        <Graph
          nodes={(props.nodes as any[]) ?? []}
          edges={(props.edges as any[]) ?? []}
          layout={(props.layout as any) ?? 'force'}
          interactive={props.interactive as boolean}
        />
      );

    case 'canvas':
      return (
        <Canvas
          drawingData={props.drawingData}
          readOnly={props.readOnly as boolean}
          width={props.width as number}
          height={props.height as number}
        />
      );

    case 'image':
      return (
        <Image
          src={(props.src as string) ?? ''}
          alt={props.alt as string}
          caption={props.caption as string}
          width={props.width as any}
          height={props.height as any}
        />
      );

    case 'gallery':
      return (
        <Gallery
          images={(props.images as any[]) ?? []}
          layout={(props.layout as any) ?? 'grid'}
          columns={props.columns as number}
        />
      );

    case 'video': {
      const srcUrl = (props.src as string) ?? '';
      const isYoutube = srcUrl.includes('youtube.com') || srcUrl.includes('youtu.be');
      
      if (isYoutube) {
        let embedUrl = srcUrl;
        if (srcUrl.includes('watch?v=')) {
          try {
            const v = new URL(srcUrl).searchParams.get('v');
            if (v) embedUrl = `https://www.youtube.com/embed/${v}`;
          } catch {}
        } else if (srcUrl.includes('youtu.be/')) {
          const parts = srcUrl.split('/');
          const v = parts[parts.length - 1];
          if (v) embedUrl = `https://www.youtube.com/embed/${v}`;
        }
        
        return (
          <Iframe
            src={embedUrl}
            title={title || 'YouTube Video'}
            width="100%"
            height="360px"
          />
        );
      }

      return (
        <Video
          src={srcUrl}
          poster={props.poster as string}
          controls={props.controls as boolean}
          autoplay={props.autoplay as boolean}
          loop={props.loop as boolean}
          muted={props.muted as boolean}
        />
      );
    }

    case 'audio':
      return (
        <Audio
          src={(props.src as string) ?? ''}
          controls={props.controls as boolean}
          autoplay={props.autoplay as boolean}
          loop={props.loop as boolean}
        />
      );

    case 'file':
      return (
        <File
          name={(props.name as string) ?? ''}
          size={props.size as number}
          mimeType={props.mimeType as string}
          downloadUrl={(props.downloadUrl as string) ?? ''}
          icon={props.icon as string}
        />
      );

    case 'pdf':
      return (
        <PDFViewer
          url={(props.url as string) ?? ''}
          initialPage={props.initialPage as number}
          scale={props.scale as number}
          showControls={props.showControls as boolean}
        />
      );

    case 'map':
      return (
        <Map
          center={(props.center as any) ?? { lat: 0, lng: 0 }}
          zoom={(props.zoom as number) ?? 10}
          markers={props.markers as any[]}
          mapType={props.mapType as any}
        />
      );

    case 'form':
      return (
        <Form
          fields={(props.fields as any[]) ?? []}
          actionId={(props.actionId as string) ?? ''}
          submitLabel={props.submitLabel as string}
        />
      );

    case 'input':
      return (
        <Input
          name={(props.name as string) ?? ''}
          type={(props.type as any) ?? 'text'}
          label={props.label as string}
          placeholder={props.placeholder as string}
          required={props.required as boolean}
          disabled={props.disabled as boolean}
          defaultValue={props.defaultValue}
        />
      );

    case 'mermaid':
      return (
        <MermaidDiagram
          definition={(props.definition as string) ?? ''}
          theme={props.theme as string}
          interactive={props.interactive as boolean}
        />
      );

    case 'html':
      return (
        <HTMLEmbed
          html={(props.html as string) ?? ''}
          sandbox={props.sandbox as boolean}
        />
      );

    case 'iframe': {
      const srcUrl = (props.src as string) ?? '';
      const isYoutube = srcUrl.includes('youtube.com') || srcUrl.includes('youtu.be');

      if (isYoutube) {
        return (
          <div className="w-full flex flex-col text-left">
            <div className="w-full bg-black relative aspect-video rounded-lg overflow-hidden">
              <iframe
                src={srcUrl}
                title={props.title as string || 'YouTube Video'}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="py-1.5 text-[9px] text-muted-foreground/75 leading-normal select-none flex items-center justify-between gap-4">
              <span className="truncate">{props.title as string || 'YouTube Video'}</span>
              <a 
                href={srcUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:underline font-bold flex items-center gap-0.5 shrink-0 cursor-pointer"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        );
      }

      return (
        <Iframe
          src={srcUrl}
          title={props.title as string}
          width={props.width as string}
          height={props.height as string}
          sandbox={props.sandbox as string}
        />
      );
    }

    case 'linked-input-chart':
    case 'linked_input_chart':
      return (
        <LinkedInputChart
          title={title}
          parameters={(props.parameters as any[]) ?? []}
          formulaLabel={props.formulaLabel as string}
          formula={props.formula as string}
          xAxisParamIndex={props.xAxisParamIndex as number}
          yAxisMin={props.yAxisMin as number}
          yAxisMax={props.yAxisMax as number}
        />
      );

    case 'conversation-outline':
    case 'conversation_outline':
      return (
        <ConversationOutline
          title={title || (props.title as string)}
          items={(props.items as any[]) ?? []}
          activeId={props.activeId as string}
          actionId={props.actionId as string}
        />
      );

    default:
      // Fallback: render as a generic artifact with the raw JSON
      return (
        <Artifact
          id={`unknown-${Date.now()}`}
          title={title || `Unknown: ${artifactType}`}
          artifactType={artifactType}
          content={JSON.stringify(props, null, 2)}
          editable={false}
          download={false}
        />
      );
  }
}

/**
 * Render basic markdown-like text.
 * Handles: **bold**, *italic*, `inline code`, ### headings, - lists, [links](url)
 */
function renderTextContent(text: string): ReactNode {
  const lines = text.split('\n');

  return (
    <div className="flex flex-col gap-1 text-sm text-foreground leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Headings
        if (trimmed.startsWith('### '))
          return <h3 key={i} className="text-sm font-bold mt-2 text-foreground">{processInline(trimmed.slice(4))}</h3>;
        if (trimmed.startsWith('## '))
          return <h2 key={i} className="text-base font-bold mt-3 text-foreground">{processInline(trimmed.slice(3))}</h2>;
        if (trimmed.startsWith('# '))
          return <h1 key={i} className="text-lg font-bold mt-3 text-foreground">{processInline(trimmed.slice(2))}</h1>;

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* '))
          return <li key={i} className="ml-4 list-disc">{processInline(trimmed.slice(2))}</li>;

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s/);
        if (numMatch)
          return <li key={i} className="ml-4 list-decimal">{processInline(trimmed.slice(numMatch[0].length))}</li>;

        // Regular paragraph
        return <p key={i}>{processInline(trimmed)}</p>;
      })}
    </div>
  );
}

/**
 * Process inline markdown: **bold**, *italic*, `code`, [link](url)
 */
function processInline(text: string): (string | ReactNode)[] {
  const parts: (string | ReactNode)[] = [];
  const inlineRe = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRe.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }

    if (match[1]) {
      // **bold**
      parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      // `code`
      parts.push(
        <code key={match.index} className="px-1 py-0.5 bg-muted text-[11px] font-mono rounded border border-border/40">
          {match[6]}
        </code>
      );
    } else if (match[7]) {
      // [link](url)
      parts.push(
        <a key={match.index} href={match[9]} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
          {match[8]}
        </a>
      );
    }

    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Main ArtifactRenderer component with Error Boundary wrapping.
 */
export function ArtifactRenderer({ blocks }: ArtifactRendererProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {blocks.map((block, index) => {
        if (block.kind === 'text') {
          return <div key={`text-${index}`}>{renderTextContent(block.content)}</div>;
        }
        return (
          <div key={`artifact-${index}`} className="w-full">
            <ArtifactErrorBoundary
              fallback={
                <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg text-left text-xs">
                  <h4 className="font-bold text-red-500 mb-1">Failed to render artifact: {block.artifactType}</h4>
                  <p className="text-muted-foreground mb-2">The component encountered a runtime error during rendering.</p>
                  <pre className="p-2 bg-muted text-[10px] font-mono rounded overflow-auto max-h-32 text-foreground/80">
                    {JSON.stringify(block.props, null, 2)}
                  </pre>
                </div>
              }
            >
              <RenderArtifact block={block} />
            </ArtifactErrorBoundary>
          </div>
        );
      })}
    </div>
  );
}
