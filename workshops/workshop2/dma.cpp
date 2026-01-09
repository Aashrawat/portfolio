//#include<cstring>
#include"cstr.h"
#include "dma.h"
namespace seneca {
	Samples* CreateSamples(const char* title) {
		Samples* samples = new Samples;

		//Dynamically allocates an array 
		// of characters in m_title to the size of title and then copies the title into it.
		int len = strlen(title) + 1;
		samples->m_title = new char[len];
		strcpy(samples->m_title, title);
		samples->m_data = nullptr;
		samples->m_size = 0;
		return samples;
	}
    void add(Samples& S, const int data[], int size) {
        if (S.m_data == nullptr) {
            
            S.m_data = new int[size];
            for (int i = 0; i < size; i++) {
                S.m_data[i] = data[i];
            }
            S.m_size = size;
        }
        else {
           int newSize = S.m_size + size;

            
            int* temp = new int[newSize];

            
            for (int i = 0; i < S.m_size; i++) {
                temp[i] = S.m_data[i];
            }

            
            for (int j = 0; j < size; j++) {
                temp[S.m_size + j] = data[j];
            }

            delete[] S.m_data;
            S.m_data = temp;
            S.m_size = newSize;
        }


          
    }

       
    void append(int*& data, int size, const int appendedData[], int dataSize) {
        
        int* newData = new int[size + dataSize];

        for (int i = 0; i < size; i++) {
            newData[i] = data[i];
        }
        for (int j = 0; j < dataSize; j++) {
            newData[size + j] = appendedData[j];
        }

        delete[] data;


        data = newData;
    }
        
       
    void freemem(Samples*& s) {
		//Deallocates:
		//m_title
			//m_data
			//The Samples structure itself
			//Sets the pointer s to nullptr.
		delete[]s->m_title;      //clean inside out
		delete[]s->m_data;
		delete s;
		s = nullptr;

	}
}