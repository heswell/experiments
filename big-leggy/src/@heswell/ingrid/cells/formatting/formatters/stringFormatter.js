const Left = 'left';
const Right = 'right';

const None = 'none';
const Capitalize = 'capitalize';

const defaultFormatting = {align:Left, capitalization:None};
const defaultOptions = {formatting:defaultFormatting};

export default class StringFormatter {

    static cellCSS = ({formatting=defaultFormatting}=defaultOptions) => {
        const {align=Left, capitalization=None} = formatting;
        const result = [];
        if (align === Right){
            result.push(Right);
        }
        if (capitalization !== Capitalize){
            result.push(capitalization);
        }
        return result.length ? result.join(' ') : '';
    }

    static formatter = (value) => {
        return value;
    }

}

