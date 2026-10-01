/**
 * HeartViewer — Embeds the Sketchfab interactive 3D model and integrates
 * the Sketchfab Viewer API to sync predictions and selections with React state.
 */
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function HeartViewer({ predictions, selectedVessel, onVesselClick }) {
  const iframeRef = useRef(null);
  const [api, setApi] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [annotations, setAnnotations] = useState([]);

  // Initialize Sketchfab API
  useEffect(() => {
    if (!iframeRef.current || !window.Sketchfab) return;
    
    const client = new window.Sketchfab(iframeRef.current);
    client.init('434745c88e084b508d5da0583a5dd269', {
      autostart: 1,
      annotations_visible: 1,
      preload: 1,
      transparent: 1,
      ui_infos: 0, // hide sketchfab title/author in iframe (we add it at the bottom)
      ui_watermark: 0,
      success: (sketchfabApi) => {
        sketchfabApi.start();
        sketchfabApi.addEventListener('viewerready', () => {
          setIsLoaded(true);
          setApi(sketchfabApi);
          
          sketchfabApi.getAnnotationList((err, annos) => {
            if (!err && annos) {
              setAnnotations(annos);
            }
          });
          
          // Listen for user clicking annotations in Sketchfab
          sketchfabApi.addEventListener('annotationSelect', (index) => {
            sketchfabApi.getAnnotationList((err, annos) => {
               if(err) return;
               const anno = annos[index];
               if(anno) {
                 const title = (anno.name || anno.title || '').toUpperCase();
                 if (title.includes('LAD')) onVesselClick?.('LAD');
                 else if (title.includes('LCX') || title.includes('CIRCUMFLEX')) onVesselClick?.('LCX');
                 else if (title.includes('RCA') || title.includes('RIGHT')) onVesselClick?.('RCA');
               }
            });
          });
        });
      },
      error: () => {
        console.error('Sketchfab API error');
      }
    });
  }, [onVesselClick]);

  // Sync selected vessel from external React state to Sketchfab annotations
  useEffect(() => {
    if (!api || !selectedVessel || annotations.length === 0) return;
    
    // Match selectedVessel to annotation title
    const target = annotations.find(a => {
      const t = (a.name || a.title || '').toUpperCase();
      if (selectedVessel === 'LAD' && t.includes('LAD')) return true;
      if (selectedVessel === 'LCX' && (t.includes('LCX') || t.includes('CIRCUMFLEX'))) return true;
      if (selectedVessel === 'RCA' && (t.includes('RCA') || t.includes('RIGHT'))) return true;
      return false;
    });

    if (target) {
      api.gotoAnnotation(target.index, { preventCameraAnimation: false, preventCameraMove: false });
    }
  }, [selectedVessel, api, annotations]);

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col relative rounded-xl overflow-hidden bg-slate-900/50">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/80 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
          <p className="text-slate-300 font-medium text-sm">Loading Sketchfab Model...</p>
        </div>
      )}
      
      <div className="sketchfab-embed-wrapper w-full h-full flex-grow">
        <iframe
          ref={iframeRef}
          title="cardiac_anatomy_external_view_of_human_heart"
          className="w-full h-full border-0 outline-none"
          allowFullScreen
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          xr-spatial-tracking="true"
          execution-while-out-of-viewport="true"
          execution-while-not-rendered="true"
          web-share="true"
          src="https://sketchfab.com/models/434745c88e084b508d5da0583a5dd269/embed?autostart=1&annotations_visible=1&preload=1&ui_infos=0&ui_watermark=0"
        ></iframe>
      </div>
      
      {/* Attribution block as requested by the provided Sketchfab embed code */}
      <div className="absolute bottom-0 w-full bg-slate-950/80 p-2 text-center text-[10px] text-slate-400 backdrop-blur-md border-t border-slate-800">
        <a href="https://sketchfab.com/3d-models/cardiac-anatomy-external-view-of-human-heart-434745c88e084b508d5da0583a5dd269" target="_blank" rel="nofollow noreferrer" className="font-semibold text-teal-400 hover:text-teal-300">
          cardiac_anatomy_external_view_of_human_heart
        </a> by <a href="https://sketchfab.com/quan655737" target="_blank" rel="nofollow noreferrer" className="font-semibold text-teal-400 hover:text-teal-300">quan655737</a> on <a href="https://sketchfab.com" target="_blank" rel="nofollow noreferrer" className="font-semibold text-teal-400 hover:text-teal-300">Sketchfab</a>
      </div>
    </div>
  );
}
