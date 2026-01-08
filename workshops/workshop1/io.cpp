#define _CRT_SECURE_NO_WARNINGS
#include<iostream>
#include "io.h"
using namespace std;
namespace seneca {

	void read(char* name) {
		cout << "Name\n> ";
		cin >> name;


	}
	void print(long long int phoneNum)
	{
		cout << "(";
		cout << phoneNum / 10000000;
        cout << ") ";
		long long int pn2 = phoneNum % 10000000;
		cout << pn2 / 10000 << "-" << pn2 % 10000;




	}
	void print(PhoneRec& pr, size_t& rn, const char* fil) {
		if (fil == nullptr || strstr(pr.firstName, fil) || strstr(pr.lastName, fil)) {
			cout << rn << ": " << pr.firstName << " " << pr.lastName<< " ";
			print(pr.phoneNum);
			rn++;
			cout << endl;

		}

	}
	bool read(PhoneRec& pr, FILE* fp) {
		
		//fscanf returns 1 on successful read of all items and 0 for failure
		int ret (fscanf(fp, "%s %s %lld", pr.firstName, pr.lastName, &pr.phoneNum) == 3);
			
		

		return ret;
	}
	void print(PhoneRec* arrpr[], size_t size, const char* fil) {
		size_t row = 1;
		for (size_t i = 0; i < size; i++) {
			print(*arrpr[i], row, fil);
		}
	}
	void setPointers(PhoneRec* arrPtr[], PhoneRec arr[], int size) {
		for (int i = 0; i < size; i++) {
			arrPtr[i] = &arr[i];
		}
	}
	void sort(PhoneRec* arrPtr[], size_t size, bool byLastName) {
		for (size_t i = 0; i < size - 1; i++) {
			for (size_t j = i + 1; j < size; j++) {
				if (byLastName) {
					if (strcmp(arrPtr[i]->lastName, arrPtr[j]->lastName) > 0) {
						PhoneRec* temp = arrPtr[i];
						arrPtr[i] = arrPtr[j];
						arrPtr[j] = temp;
					}
				}
				else {
					if (strcmp(arrPtr[i]->firstName, arrPtr[j]->firstName) > 0) {
						PhoneRec* temp = arrPtr[i];
						arrPtr[i] = arrPtr[j];
						arrPtr[j] = temp;
					}
				}
			}
		}
	}

}
