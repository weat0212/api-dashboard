const excelReader = async function (file) {

    console.log('開始讀檔...');

    let result = await new Promise((resolve) => {

        let reader = new FileReader();

        reader.onload = function (e) {
            let dataset = {};
            var data = e.target.result;
            var workbook = XLSX.read(data, {
                type: 'binary'
            });

            workbook.SheetNames.forEach(function (sheetName, index) {
                var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                var json = JSON.stringify(XL_row_object, null, 2);
                dataset[index] = JSON.parse(json);
            })
            resolve(dataset);
        };

        reader.onerror = function (ex) {
            console.log(ex);
        };

        reader.readAsBinaryString(file);
    })
    console.log(result);
    return result;
}