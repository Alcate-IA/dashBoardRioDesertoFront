"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import QualidadeAgua from '@/components/QualidadeAgua';

export default function Page() {
  const searchParams = useSearchParams();
  const cdPiezometro = searchParams.get('cdPiezometro');
  const mesAnoInicio = searchParams.get('mesAnoInicio');
  const mesAnoFim = searchParams.get('mesAnoFim');

  if (!cdPiezometro || !mesAnoInicio || !mesAnoFim) {
    return null;
  }

  return (
    <div style={{ padding: 24 }}>
      <QualidadeAgua
        initialCdPiezometro={Number(cdPiezometro)}
        initialMesAnoInicio={mesAnoInicio}
        initialMesAnoFim={mesAnoFim}
        autoApply
      />
    </div>
  );
}
