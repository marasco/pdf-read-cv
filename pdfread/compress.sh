#!/bin/sh
rm -f archivos.tar
for f in downloads/*.pdf; do
  tar -rvf archivos.tar "$f" || echo "Error al añadir $f, sigo..."
done
gzip archivos.tar

