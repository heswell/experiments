import MessageQueue from '../../server-core/message-queue';
import {setFilterColumnMeta} from '../../data/store/filterUtils';
import { DataTypes } from '../../data';
import {join, pluck} from '../data/testData';

const viewport = 'testvp';
const offset = 0;
const size = 100;

describe('MessageQueue', () =>{

  describe('push', () => {

    test('filterData into wmpty queue', () => {
      const Q = new MessageQueue();
      Q.push({
        priority: 1,
        viewport,
        type: DataTypes.FILTER_DATA,
        data: {
          range: {lo: 145, hi: 156},
          size,
          offset,
          rows: [
            ["Bellicum Pharmaceuticals, Inc.",1,1,151,0,0,"Bellicum Pharmaceuticals, Inc.",0],
            ["Benefitfocus, Inc.",1,1,152,0,0,"Benefitfocus, Inc.",0],
            ["Big 5 Sporting Goods Corporation",1,1,153,0,0,"Big 5 Sporting Goods Corporation",0],
            ["Bio Blast Pharma Ltd.",1,1,154,0,0,"Bio Blast Pharma Ltd.",0],
            ["BioCryst Pharmaceuticals, Inc.",1,1,155,0,0,"BioCryst Pharmaceuticals, Inc.",0]
          ]
        }
      }, setFilterColumnMeta);

      expect(Q.length).toEqual(1);

      Q.push({
        priority: 1,
        viewport,
        type: DataTypes.FILTER_DATA,
        data: {
          range: {lo: 149, hi: 160},
          size,
          offset,
          rows: [
            ["BioMarin Pharmaceutical Inc.",1,1,156,0,0,"BioMarin Pharmaceutical Inc.",0],
            ["BioTelemetry, Inc.",1,1,157,0,0,"BioTelemetry, Inc.",0],
            ["Bioanalytical Systems, Inc.",1,1,158,0,0,"Bioanalytical Systems, Inc.",0],
            ["Biocept, Inc.",1,1,159,0,0,"Biocept, Inc.",0]
          ]
        }
      }, setFilterColumnMeta);

      expect(Q.length).toEqual(1);

      Q.push({
        priority: 1,
        viewport,
        type: DataTypes.FILTER_DATA,
        data: {
          range: {lo: 153, hi: 164},
          size,
          offset,
          rows: [
            ["Biodel Inc.",1,1,160,0,0,"Biodel Inc.",0],
            ["Birner Dental Management Services, Inc.",1,1,161,0,0,"Birner Dental Management Services, Inc.",0],
            ["Blackbaud, Inc.",1,1,162,0,0,"Blackbaud, Inc.",0],
            ["Blackhawk Network Holdings, Inc.",1,1,163,0,0,"Blackhawk Network Holdings, Inc.",0]
          ]
        }
      }, setFilterColumnMeta);

      expect(Q.length).toEqual(1);

      Q.push({
        priority: 1,
        viewport,
        type: DataTypes.FILTER_DATA,
        data: {
          range: {lo: 156, hi: 167},
          size,
          offset,
          rows: [
            ["Bloomin&#39; Brands, Inc.",1,1,164,0,0,"Bloomin&#39; Brands, Inc.",0],
            ["Blue Hills Bancorp, Inc.",1,1,165,0,0,"Blue Hills Bancorp, Inc.",0],
            ["Blue Nile, Inc.",1,1,166,0,0,"Blue Nile, Inc.",0]          ]
        }
      }, setFilterColumnMeta);

      expect(Q.length).toEqual(1);
      const updates = Q.queue;
      expect(Q.length).toEqual(0);
      expect(updates.length).toEqual(1);

    })


  })

})