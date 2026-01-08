"use client";

import React from 'react';
import { Carousel } from 'primereact/carousel';
import { Skeleton } from 'primereact/skeleton';
import Image from 'next/image';

interface FotoInspecao {
    idFoto: number;
    cdPiezometro: number;
    nmArquivo: string;
    caminhoCompleto: string;
    dataInsercao: string;
}

interface PropriedadesCarrossel {
    fotos: FotoInspecao[];
    estaCarregando: boolean;
}

/**
 * Componente que exibe um carrossel de "fotos" das inspeções.
 * Utiliza o componente Next/Image para otimização e carregamento de fontes remotas.
 */
export default function CarrosselFotosInspecao({ fotos, estaCarregando }: PropriedadesCarrossel) {

    const opcoesResponsividade = [
        { breakpoint: '1400px', numVisible: 3, numScroll: 1 },
        { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
        { breakpoint: '767px', numVisible: 1, numScroll: 1 }
    ];

    const formatarDataHora = (dataString: string) => {
        try {
            const data = new Date(dataString);
            return data.toLocaleString('pt-BR');
        } catch (e) {
            return dataString;
        }
    };

    const templateFoto = (foto: FotoInspecao) => {
        return (
            <div className="p-2 h-full">
                <div className="surface-card shadow-2 border-round border-1 border-300 flex align-items-center justify-content-center h-25rem relative overflow-hidden bg-black-alpha-10">
                    <Image
                        src={foto.caminhoCompleto}
                        alt={foto.nmArquivo}
                        fill
                        style={{ objectFit: 'contain' }}
                        unoptimized // Adicionado para evitar problemas com o otimizador de imagens em ambientes de desenvolvimento com IPs locais
                    />
                    {/* Caption Overlay */}
                    <div className="absolute bottom-0 left-0 w-full bg-black-alpha-50 text-white p-2 text-center text-sm">
                        {formatarDataHora(foto.dataInsercao)}
                    </div>
                </div>
            </div>
        );
    };

    if (estaCarregando) {
        return (
            <div className="grid">
                {[1, 2, 3].map((_, i) => (
                    <div key={i} className="col-12 md:col-4">
                        <Skeleton height="15rem" />
                    </div>
                ))}
            </div>
        );
    }

    if (!fotos || fotos.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 mb-5">
            <div className="flex align-items-center gap-2 mb-3">
                <i className="pi pi-camera text-primary text-2xl"></i>
                <h2 className="m-0 text-xl font-bold">Fotos de Inspeção</h2>
            </div>

            <Carousel
                value={fotos}
                numVisible={3}
                numScroll={1}
                responsiveOptions={opcoesResponsividade}
                itemTemplate={templateFoto}
                circular={fotos.length > 3}
                autoplayInterval={7000}
            />
        </div>
    );
}

