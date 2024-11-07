define([
    "esri/layers/Layer",
    "esri/geometry/Point",
    "esri/geometry/support/webMercatorUtils",
    "esri/views/2d/layers/BaseLayerView2D"
], function (
    Layer,
    Point,
    webMercatorUtils,
    BaseLayerView2D
) {
    this.min = 0;
    this.max = 1;
    this.palette = {};

    const HotlineLayerView = BaseLayerView2D.createSubclass({
        constructor: (params) => {
            this.view = params.view;
            this.layer = params.layer;
        },
        attach: () => {
        },
        render: (renderParameters) => {
            const state = renderParameters.state;
            const ctx = renderParameters.context;

            ctx.globalCompositeOperation = 'source-over';
            ctx.lineCap = 'round';

            drawOutline(ctx, state, this.layer.data, this.layer.weight, this.layer.outlineWidth, this.layer.outlineColor);
            drawHotline(ctx, state, this.layer.data, this.layer.weight);
        },

        // Método detach
        detach() {
            this.view.container.removeChild(this.canvas);
        }
    });

    const HotlineLayer = Layer.createSubclass({
        properties: {
            min: 0,
            max: 1,
            palette: {
                0.0: 'green',
                0.5: 'yellow',
                1.0: 'red'
            },
            weight: 5,
            outlineWidth: 1,
            outlineColor: 'black'
        },
        constructor: (params) => {
            this.min = params.min;
            this.max = params.max;
            generatePalette(params.palette);
        },
        createLayerView: function (view) {
            const layer = this;
            if (view.type === "2d") {
                return new HotlineLayerView({
                    view: view,
                    layer: layer
                });
            }
        }
    });

    const drawOutline = (ctx, state, data, weight, outlineWidth, outlineColor) => {
        var i, j, dataLength, path, pathLength, pointStart, pointEnd;

        if (outlineWidth) {
            for (i = 0, dataLength = data.length; i < dataLength; i++) {
                path = data[i];
                ctx.lineWidth = weight + 2 * outlineWidth;

                for (j = 1, pathLength = path.length; j < pathLength; j++) {
                    pointStart = path[j - 1];
                    pointEnd = path[j];

                    const point1 = new Point({
                        longitude: pointStart[0],
                        latitude: pointStart[1]
                    });

                    const point2 = new Point({
                        longitude: pointEnd[0],
                        latitude: pointEnd[1]
                    });

                    const wmPoint1 = webMercatorUtils.geographicToWebMercator(point1);
                    const wmPoint2 = webMercatorUtils.geographicToWebMercator(point2);

                    const screenPointStart = [0, 0];
                    state.toScreen(screenPointStart, wmPoint1.x, wmPoint1.y);

                    const screenPointEnd = [0, 0];
                    state.toScreen(screenPointEnd, wmPoint2.x, wmPoint2.y);

                    ctx.strokeStyle = outlineColor;
                    ctx.beginPath();
                    ctx.moveTo(screenPointStart[0], screenPointStart[1]);
                    ctx.lineTo(screenPointEnd[0], screenPointEnd[1]);
                    ctx.stroke();
                }
            }
        }
    }

    const generatePalette = (palette) => {
        const defaultPalette = {
            0.0: 'green',
            0.5: 'yellow',
            1.0: 'red'
        };
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;
        var currentPalette = palette || defaultPalette;

        for (var i in currentPalette) {
            gradient.addColorStop(i, palette[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this.palette = ctx.getImageData(0, 0, 1, 256).data;
    }

    const drawHotline = (ctx, state, data, weight) => {
        var i, j, dataLength, path, pathLength, pointStart, pointEnd,
            gradient, gradientStartRGB, gradientEndRGB;

        ctx.lineWidth = weight;
        for (i = 0, dataLength = data.length; i < dataLength; i++) {
            path = data[i];

            for (j = 1, pathLength = path.length; j < pathLength; j++) {
                pointStart = path[j - 1];
                pointEnd = path[j];

                const point1 = new Point({
                    longitude: pointStart[0],
                    latitude: pointStart[1]
                });

                const point2 = new Point({
                    longitude: pointEnd[0],
                    latitude: pointEnd[1]
                });

                const wmPoint1 = webMercatorUtils.geographicToWebMercator(point1);
                const wmPoint2 = webMercatorUtils.geographicToWebMercator(point2);

                const screenPointStart = [0, 0];
                state.toScreen(screenPointStart, wmPoint1.x, wmPoint1.y);

                const screenPointEnd = [0, 0];
                state.toScreen(screenPointEnd, wmPoint2.x, wmPoint2.y);

                gradient = ctx.createLinearGradient(screenPointStart[0], screenPointStart[1], screenPointEnd[0], screenPointEnd[1]);
                gradientStartRGB = getRGBForValue(pointStart[2]);
                gradientEndRGB = getRGBForValue(pointEnd[2]);
                gradient.addColorStop(0, 'rgb(' + gradientStartRGB.join(',') + ')');
                gradient.addColorStop(1, 'rgb(' + gradientEndRGB.join(',') + ')');

                ctx.strokeStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(screenPointStart[0], screenPointStart[1]);
                ctx.lineTo(screenPointEnd[0], screenPointEnd[1]);
                ctx.stroke();
            }
        }
    }

    const getRGBForValue = (value) => {
        var valueRelative = Math.min(Math.max((value - this.min) / (this.max - this.min), 0), 0.999);
        var paletteIndex = Math.floor(valueRelative * 256) * 4;
        // console.log(paletteIndex);
        return [
            this.palette[paletteIndex],
            this.palette[paletteIndex + 1],
            this.palette[paletteIndex + 2]
        ];
    };

    return HotlineLayer;
});
