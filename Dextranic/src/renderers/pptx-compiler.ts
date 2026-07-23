import pptxgen from "pptxgenjs";
import { PresentationNode, SlideNode } from "../compiler/ast";
import { parseRichText } from "../compiler/rich-text-parser";

export async function compileToPPTX(ast: PresentationNode) {
  const pres = new pptxgen();
  
  // Apply presentation properties
  if (ast.properties.title) {
    pres.title = ast.properties.title;
  }
  
  // Theme properties
  const theme = ast.children.find(child => child.type === 'Theme')?.properties || {};
  const bgColor = theme.background ? theme.background.replace('#', '') : 'FFFFFF';
  const textColor = theme.color ? theme.color.replace('#', '') : '000000';
  
  const slides = ast.children.filter((child): child is SlideNode => child.type === 'Slide');

  slides.forEach((slideNode) => {
    const slide = pres.addSlide();
    
    // Background properties
    const bg = slideNode.properties.background;
    if (bg) {
      if (bg.startsWith('http') || bg.startsWith('data:image')) {
        slide.background = { path: bg };
      } else {
        slide.background = { color: bg.replace('#', '') };
      }
    } else {
      slide.background = { color: bgColor };
    }

    const layout = slideNode.properties.layout || 'standard';
    const isSplit = (layout === 'split-left' || layout === 'split-right');
    const firstImageNode = slideNode.children.find(child => child.type === 'Image') as any;

    // Define column widths and coordinates
    let colX = 0.8;
    let colW = 8.4;
    let titleX = 0.5;
    let titleW = 9.0;

    if (isSplit && firstImageNode) {
      if (layout === 'split-left') {
        // Image on left, content on right
        slide.addImage({
          path: firstImageNode.src,
          x: 0.5,
          y: 0.8,
          w: 4.2,
          h: 4.2,
          sizing: { type: 'contain', w: 4.2, h: 4.2 }
        });
        colX = 5.2;
        colW = 4.3;
        titleX = 5.2;
        titleW = 4.3;
      } else {
        // Content on left, image on right
        slide.addImage({
          path: firstImageNode.src,
          x: 5.3,
          y: 0.8,
          w: 4.2,
          h: 4.2,
          sizing: { type: 'contain', w: 4.2, h: 4.2 }
        });
        colX = 0.5;
        colW = 4.3;
        titleX = 0.5;
        titleW = 4.3;
      }
    } else if (layout === 'asymmetric-left') {
      colX = 0.8;
      colW = 5.0;
      titleX = 0.8;
      titleW = 5.0;
    } else if (layout === 'asymmetric-right') {
      colX = 4.2;
      colW = 5.0;
      titleX = 4.2;
      titleW = 5.0;
    } else if (layout === 'full-hero') {
      colX = 0.8;
      colW = 8.4;
      titleX = 0.8;
      titleW = 8.4;
    }

    // Draw frosted glass panel if glass property is active
    const bgStr = slideNode.properties.background || '';
    const isDark = bgStr ? ['#0b0f19', '#121214', '#050811', '#030712', '#000000', '#020617', '#0f172a', '#1c0d0d', '#0d1321'].includes(bgStr.toLowerCase()) : true;
    if (slideNode.properties.glass === 'true') {
      slide.addShape(pres.ShapeType.roundRect, {
        x: colX - 0.2,
        y: 0.4,
        w: colW + 0.4,
        h: 4.8,
        fill: { color: isDark ? '111827' : 'FFFFFF', alpha: 15 },
        line: { color: isDark ? 'FFFFFF' : '000000', width: 1 }
      });
    }

    let currentY = 0.5;

    // Title
    if (slideNode.properties.title) {
      const titleRuns = parseRichText(slideNode.properties.title).map(run => ({
        text: run.text,
        options: {
          bold: run.bold !== undefined ? run.bold : true,
          italic: run.italic,
          color: run.color || textColor,
          fontFace: run.fontFace,
          size: run.fontSize || 32
        }
      }));
      slide.addText(titleRuns, {
        x: titleX,
        y: currentY,
        w: titleW,
        h: 0.8
      });
      currentY += 1.0;
    }

    const remainingChildren = firstImageNode && isSplit
      ? slideNode.children.filter(child => child !== firstImageNode)
      : slideNode.children;

    // Children
    remainingChildren.forEach((child) => {
      if (child.type === 'Bullets') {
        const bulletRuns: any[] = [];
        child.items.forEach(item => {
          const parsed = parseRichText(item);
          parsed.forEach((run, rIdx) => {
            bulletRuns.push({
              text: run.text,
              options: {
                bullet: rIdx === 0 ? true : false,
                bold: run.bold,
                italic: run.italic,
                color: run.color || textColor,
                fontFace: run.fontFace,
                size: run.fontSize || (isSplit ? 16 : 20)
              }
            });
          });
        });

        slide.addText(bulletRuns, {
          x: colX,
          y: currentY,
          w: colW,
          h: isSplit ? 1.5 : 2,
          lineSpacing: isSplit ? 24 : 32
        });
        currentY += isSplit ? 1.6 : 2.2;
      }

      if (child.type === 'Text') {
        const props = child.properties;
        const runs = parseRichText(child.text || props.content || '').map(run => ({
          text: run.text,
          options: {
            bold: run.bold,
            italic: run.italic,
            color: run.color || props.color || textColor,
            fontFace: run.fontFace || props.font || undefined,
            size: run.fontSize || (props.size ? parseInt(props.size, 10) : (isSplit ? 16 : 20))
          }
        }));

        const options: any = {
          x: colX,
          y: currentY,
          w: colW,
          h: 0.6,
          align: props.align || 'left',
          valign: 'middle'
        };

        if (props.shadow === 'true') {
          options.shadow = { type: 'outer', color: '64748B', blur: 4, offset: 2, angle: 45 };
        }

        slide.addText(runs, options);
        currentY += 0.8;
      }

      if (child.type === 'Code') {
        const props = child.properties;
        const codeContent = props.content || '';

        slide.addShape(pres.ShapeType.roundRect, {
          x: colX,
          y: currentY,
          w: colW,
          h: isSplit ? 1.5 : 2.0,
          fill: { color: '1E1E1E' },
          rectRadius: 0.05
        });

        slide.addShape(pres.ShapeType.roundRect, {
          x: colX,
          y: currentY,
          w: colW,
          h: 0.35,
          fill: { color: '252526' },
          rectRadius: 0.05
        });

        slide.addText((props.language || 'code').toUpperCase(), {
          x: colX + colW - 1.2,
          y: currentY + 0.03,
          w: 1.0,
          h: 0.25,
          color: '858585',
          fontSize: 9,
          fontFace: 'Courier New',
          align: 'right'
        });

        slide.addText(codeContent, {
          x: colX + 0.15,
          y: currentY + 0.45,
          w: colW - 0.3,
          h: isSplit ? 0.9 : 1.4,
          color: 'D4D4D4',
          fontSize: 10,
          fontFace: 'Courier New',
          align: 'left',
          valign: 'top'
        });

        currentY += isSplit ? 1.7 : 2.2;
      }

      if (child.type === 'Equation') {
        const props = child.properties;
        const formula = props.formula || '';

        slide.addText(formula, {
          x: colX,
          y: currentY,
          w: colW,
          h: 0.8,
          color: textColor,
          fontSize: isSplit ? 20 : 26,
          fontFace: 'Georgia',
          italic: true,
          align: 'center',
          valign: 'middle'
        });

        currentY += 1.0;
      }
      
      if (child.type === 'Image') {
        slide.addImage({
          path: child.src,
          x: colX,
          y: currentY,
          w: colW,
          h: isSplit ? 1.8 : 3,
          sizing: { type: 'contain', w: colW, h: isSplit ? 1.8 : 3 }
        });
        currentY += isSplit ? 2.0 : 3.2;
      }
      
      if (child.type === 'Diagram') {
        child.edges.forEach((edge, eIdx) => {
          // Node (From)
          slide.addShape(pres.ShapeType.roundRect, {
            x: colX + (colW - 2.5) / 2, y: currentY, w: 2.5, h: 0.5,
            fill: { color: '3B82F6' },
            rectRadius: 0.1
          });
          slide.addText(edge.from, {
            x: colX + (colW - 2.5) / 2, y: currentY, w: 2.5, h: 0.5,
            color: 'FFFFFF', bold: true, fontSize: 12,
            align: 'center', valign: 'middle'
          });
          currentY += 0.5;

          // Arrow (Down)
          slide.addShape(pres.ShapeType.downArrow, {
            x: colX + (colW - 0.3) / 2, y: currentY, w: 0.3, h: 0.4,
            fill: { color: '94A3B8' }
          });
          currentY += 0.4;

          // If last edge, add the final 'To' node
          if (eIdx === child.edges.length - 1) {
            slide.addShape(pres.ShapeType.roundRect, {
              x: colX + (colW - 2.5) / 2, y: currentY, w: 2.5, h: 0.5,
              fill: { color: '3B82F6' },
              rectRadius: 0.1
            });
            slide.addText(edge.to, {
              x: colX + (colW - 2.5) / 2, y: currentY, w: 2.5, h: 0.5,
              color: 'FFFFFF', bold: true, fontSize: 12,
              align: 'center', valign: 'middle'
            });
            currentY += 0.7;
          }
        });
      }

      if (child.type === 'Table') {
        const props = (child as any).properties;
        const headers: string[] = props.headers ? props.headers.split(',').map((s: string) => s.trim()) : [];
        const rows: string[][] = props.rows ? props.rows.split(';').map((row: string) => row.split('|').map((s: string) => s.trim())) : [];
        
        if (headers.length > 0 || rows.length > 0) {
          const tableRows = [
            headers.map(h => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: '333333' } })),
            ...rows.map(row => row.map(cell => ({ text: cell })))
          ];
          
          slide.addTable(tableRows, {
            x: colX,
            y: currentY,
            w: colW,
            colW: Array(headers.length).fill(colW / headers.length)
          });
          currentY += (rows.length * 0.35) + 0.8;
        }
      }

      if (child.type === 'Chart') {
        const props = (child as any).properties;
        const chartType = props.type || 'bar';
        const labels: string[] = props.labels ? props.labels.split(',').map((s: string) => s.trim()) : [];
        const data: number[] = props.data ? props.data.split(',').map((s: string) => parseFloat(s.trim()) || 0) : [];
        
        if (data.length > 0) {
          let pptxChartType = pres.ChartType.bar;
          if (chartType === 'line') pptxChartType = pres.ChartType.line;
          else if (chartType === 'pie') pptxChartType = pres.ChartType.pie;
          
          const chartData = [
            {
              name: props.title || 'Chart Data',
              labels: labels,
              values: data
            }
          ];
          
          slide.addChart(pptxChartType, chartData, {
            x: colX,
            y: currentY,
            w: colW,
            h: isSplit ? 1.8 : 2.5,
            showLegend: true
          });
          currentY += isSplit ? 2.0 : 2.8;
        }
      }
    });
  });

  await pres.writeFile({ fileName: `Dextranic_Presentation.pptx` });
}
