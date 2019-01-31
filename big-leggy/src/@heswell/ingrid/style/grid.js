
const styles = {
    Header : {
        position: 'absolute',
        top:0,
        left:0,
        right:0,
        cursor: 'default',
        borderBottom: 'solid 1px rgb(41,41,41)'
    },

    Viewport : {
        position: 'absolute',
        top: 25,
        left:0,
        right:0,
        bottom:0,
        padding:0,
        overflow: 'hidden'
    },

    ViewportContent : {
        position: 'absolute',
        top:0,
        left:0,
        right:0,
        padding:0
    },

    Canvas : {
        position: 'absolute',
        top:0,
        overflow:'hidden'
    },

    CanvasContent : {
        position: 'absolute',
        overflow : 'hidden'
    },

    Gutter : {
        position: 'absolute',
        top:0,
        bottom:0,
        backgroundColor: 'red'		
    }

} ;

export default styles;