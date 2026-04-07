/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
*/
#ifndef SENECA_DICTIONARY_H
#define SENECA_DICTIONARY_H

#include <string>
#include <iostream>

namespace seneca {

    enum class PartOfSpeech {
        Unknown,
        Noun,
        Pronoun,
        Adjective,
        Adverb,
        Verb,
        Preposition,
        Conjunction,
        Interjection,
    };

    struct Word {
        std::string m_word{};
        std::string m_definition{};
        PartOfSpeech m_pos{ PartOfSpeech::Unknown };
    };

    class Dictionary {
        Word* m_words{ nullptr };
        size_t m_size{ 0 };

        PartOfSpeech parsePOS(const std::string& pos) const;
        const char* posToString(PartOfSpeech pos) const;

    public:
        Dictionary();
        Dictionary(const char* filename);

        
        ~Dictionary();
        Dictionary(const Dictionary& other);
        Dictionary& operator=(const Dictionary& other);
        Dictionary(Dictionary&& other) noexcept;
        Dictionary& operator=(Dictionary&& other) noexcept;

        void searchWord(const char* word) const;
    };

}

#endif // SENECA_DICTIONARY_H
