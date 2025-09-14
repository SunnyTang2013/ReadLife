import rest from './rest';

export default {

  addBankHoliday(bankHoliday) {
    const url = '/api/v1/bank-holiday/create';
    return rest.post(url, bankHoliday).then(response => rest.handleJSONResponse(response));
  },

  updateBankHoliday(bankHoliday) {
    const url = '/api/v1/bank-holiday/update';
    return rest.post(url, bankHoliday).then(response => rest.handleJSONResponse(response));
  },

  batchUpdateBankHoliday(bankHolidayList) {
    const url = '/api/v1/bank-holiday/batchUpdate';
    return rest.post(url, bankHolidayList).then(response => rest.handleJSONResponse(response));
  },

  delBankHoliday(id) {
    const url = `/api/v1/bank-holiday/delete/${id}`;
    return rest.delete(url).then(response => rest.handleJSONResponse(response));
  },

  listBankHolidays() {
    const url = '/api/v1/bank-holiday/list';
    return rest.get(url).then(response => rest.handleJSONResponse(response));
  },

};
