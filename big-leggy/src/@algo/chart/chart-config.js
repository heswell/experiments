import {prices, orders, min, max, annotations} from './chart-data'

const sellColor = '#c48f7e';
// const buyColor = '#8ea363'
const buyColor = 'limegreen'

export const option = {
    animation: false,
    grid : {
        left: '5%',
        right: '3%'
    },
    dataset: [
        {
            source: prices,
            dimensions: ['timestamp', 'bid', 'ask']
        }, {
            source: orders,
            dimensions: ['timestamp', 'price', 'direction', 'qty', 'status', 'completionTime']
        }
    ],
    xAxis: {
        type: 'time',
        // min: 'dataMin',
        // max: 'dataMax',
        splitLine: {
            show: false
        }
    },
    yAxis: {
        type: 'value',
        min,
        max,
        splitLine: {
            show: false
        }
    },
    series: [
        {
            name: 'Bid',
            type: 'line',
            step: true,
            showSymbol: false,
            hoverAnimation: false,
            datasetIndex: 0,
            encode: {
                x: 'timestamp',
                y: 'bid'
            },
            itemStyle : {
                color: 'green'
            },
            z: 1
        },
        {
            name: 'Ask',
            type: 'line',
            step: true,
            showSymbol: false,
            hoverAnimation: false,
            datasetIndex: 0,
            encode: {
                x: 'timestamp',
                y: 'ask'
            },
            itemStyle : {
                color: 'red'
            },
            z: 1
        },
        {
            name: 'buy',
            type: 'custom',
            renderItem: renderCancelledOrder,
            datasetIndex: 1,
            z: 2
        },
        {
            name: 'annotation',
            type: 'custom',
            renderItem: renderAnnotation,
            data: annotations,
            z: 0
        }
    ]
};

const radius = 5;

function renderAnnotation(params, api){
    console.log(`%cAnnotation ${api.value(0)} ${api.value(1)} ${api.value(2)}`, 'color:red;font-weight: bold;')
    const timestamp = api.value(0);
    const type = api.value(2);

    if (type === 'momentum'){
        const startPoint = api.coord([timestamp,240]);
        const endPoint = api.coord([timestamp,280]);
        console.log(`momentum at ${startPoint} - ${endPoint}`)
        return {
            type: 'group',
            children: [
                line(api, startPoint, endPoint, {
                    stroke: 'orange',
                    lineWidth: 3,
                    shadowColor: 'orange',
                    shadowBlur: 7,
                    opacity: 0.4
                }),
                {
                    type: 'text',
                    style: {
                        text: 'Momentum',
                        x: startPoint[0] - 6,
                        y: endPoint[1] - 15,
                        fill: '#888'
                    }
                }
            ]
        }
    } else if (type === 'layering'){
        const price1 = api.value(1);
        const ts2 = api.value(3);
        const price2 = api.value(4);

        const [x1,y1] = api.coord([timestamp,price1]);
        const [x2, y2] = api.coord([ts2,price2]);
        console.log(`rect ${x1} ${y1} ${x2} ${y2}`)
        return {
            type: 'group',
            children: [
                {
                    type: 'rect',
                    shape: {
                        x: x1,
                        y: y1,
                        width: x2 - x1,
                        height: y2 - y1
                    },
                    style: {
                        fill: 'green',
                        opacity: 0.1
                    }
                },
                {
                    type: 'text',
                    style: {
                        text: 'Layering',
                        x: x1 + (x2-x1)/2 - 30,
                        y: y2,
                        fill: '#888'
                    }
                }
            ] 
        }
    }

}

function renderCancelledOrder(params, api) {
    const timestamp = api.value(0);
    const price = api.value(1);
    const direction = api.value(2);
    const status = api.value(4);
    const completionTime = api.value(5);

    var startPoint = api.coord([timestamp, price]);
    var endPoint = api.coord([completionTime, price]);

    const color = direction === 'buy'
        ? buyColor
        : sellColor;

    const finalFill = status === 'cancelled'
        ? 'none'
        : color;    

    const children = [
        circle(api, startPoint[0], startPoint[1],{
            fill: color,
            stroke: color,
            opacity: .6
        }),
        line(api, startPoint, endPoint, {
            stroke: color
        }, radius),
        circle(api, endPoint[0], endPoint[1],{
            fill: finalFill,
            stroke: color
        })
    ];

    if (status === 'filled'){
        children.push(diamond(api, endPoint[0],endPoint[1],{
            fill: 'blue'
        }))
    }

    return {
        // 'rect' indicates that the graphic element is rectangular.
        // Can also be 'circle', 'sector', 'polygon', ...
        type: 'group',
        children
    };
}


const circle = (api, x, y, style) => ({
    type: 'circle',
    shape: {
        cx: x,
        cy: y,
        r: radius
    },
    style: api.style(style)
})

const line = (api,startPoint, endPoint, style, offset=0) => ({
    type: 'line',
    shape: {
        x1: startPoint[0] + offset,
        y1: startPoint[1],
        x2: endPoint[0] - offset,
        y2: endPoint[1]
    },
    style: api.style(style)
})

const diamond = (api, x, y, style) => ({
    type: 'polygon',
    shape: {
        points: [
            [x,y-(radius+1)],
            [x+(radius-1),y],
            [x, y+(radius+1)],
            [x-(radius-1),y]
        ]
    },
    style: api.style(style)
})